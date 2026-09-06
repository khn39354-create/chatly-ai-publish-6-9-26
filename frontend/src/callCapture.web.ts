// Web live-transcription capture: MediaRecorder on a dedicated mic stream,
// restarted every N seconds so every chunk is a standalone playable file.
// Silent chunks (no speech energy) are skipped to avoid Whisper hallucinations.
export type CaptureChunk = { blob?: Blob; uri?: string; name: string; type: string; startedAt: string };
export type CaptureOpts = {
  recorder?: any;
  intervalMs?: number;
  onChunk: (chunk: CaptureChunk, seq: number) => void;
  onUnavailable?: (reason: string) => void;
};

export async function startChunkedCapture(opts: CaptureOpts): Promise<() => void> {
  const w: any = typeof window !== "undefined" ? window : {};
  if (!w.MediaRecorder || !w.navigator?.mediaDevices?.getUserMedia) {
    opts.onUnavailable?.("unsupported");
    return () => {};
  }
  let stream: MediaStream;
  try {
    stream = await w.navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    opts.onUnavailable?.("mic");
    return () => {};
  }

  // Simple energy meter for voice-activity detection
  let ctx: any = null, analyser: any = null, buf: Uint8Array | null = null;
  try {
    const AC = w.AudioContext || w.webkitAudioContext;
    ctx = new AC();
    const src = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    buf = new Uint8Array(analyser.fftSize);
  } catch { analyser = null; }

  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
    .find((m) => { try { return w.MediaRecorder.isTypeSupported(m); } catch { return false; } }) || "";
  const interval = opts.intervalMs ?? 8000;
  let stopped = false;
  let seq = 0;
  let rec: any = null;
  let peak = 0;

  const measure = () => {
    if (!analyser || !buf) return;
    analyser.getByteTimeDomainData(buf);
    let max = 0;
    for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128) / 128; if (v > max) max = v; }
    if (max > peak) peak = max;
  };
  const meter = setInterval(measure, 100);

  const cycle = () => {
    if (stopped) return;
    peak = 0;
    const startedAt = new Date().toISOString();
    const parts: Blob[] = [];
    try {
      rec = new w.MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      opts.onUnavailable?.("recorder");
      return;
    }
    rec.ondataavailable = (e: any) => { if (e.data && e.data.size) parts.push(e.data); };
    rec.onstop = () => {
      const type = rec?.mimeType || mime || "audio/webm";
      const blob = new Blob(parts, { type });
      const voiced = !analyser || peak > 0.02;
      if (voiced && blob.size > 2000) {
        const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
        opts.onChunk({ blob, name: `chunk_${seq}.${ext}`, type, startedAt }, seq++);
      }
      if (!stopped) cycle();
    };
    rec.start();
    setTimeout(() => { try { if (rec && rec.state !== "inactive") rec.stop(); } catch {} }, interval);
  };
  cycle();

  return () => {
    stopped = true;
    clearInterval(meter);
    try { if (rec && rec.state !== "inactive") rec.stop(); } catch {}
    try { stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { ctx?.close(); } catch {}
  };
}
