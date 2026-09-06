// Native live-transcription capture: records the local microphone in short
// chunks with expo-audio (in parallel with the WebRTC call) so each participant
// uploads their own speech and the server builds a speaker-labelled transcript.
export type CaptureChunk = { blob?: any; uri?: string; name: string; type: string; startedAt: string };
export type CaptureOpts = {
  recorder?: any;
  intervalMs?: number;
  onChunk: (chunk: CaptureChunk, seq: number) => void;
  onUnavailable?: (reason: string) => void;
};

export async function startChunkedCapture(opts: CaptureOpts): Promise<() => void> {
  const rec = opts.recorder;
  if (!rec) { opts.onUnavailable?.("no-recorder"); return () => {}; }
  const interval = opts.intervalMs ?? 8000;
  let stopped = false;
  let seq = 0;
  let timer: any = null;

  const emit = (startedAt: string) => {
    const uri = rec.uri;
    if (uri) opts.onChunk({ uri, name: `chunk_${seq}.m4a`, type: "audio/m4a", startedAt }, seq++);
  };

  const cycle = async () => {
    if (stopped) return;
    const startedAt = new Date().toISOString();
    try {
      await rec.prepareToRecordAsync();
      rec.record();
    } catch {
      // Microphone busy (some devices don't allow a second capture next to WebRTC)
      opts.onUnavailable?.("mic-busy");
      return;
    }
    timer = setTimeout(async () => {
      if (stopped) return;
      try { await rec.stop(); emit(startedAt); } catch {}
      cycle();
    }, interval);
  };

  cycle();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    const startedAt = new Date().toISOString();
    rec.stop().then(() => emit(startedAt)).catch(() => {});
  };
}
