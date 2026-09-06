// Native helpers for calls: an expo-audio recorder instance (used for live
// transcription chunks) and audio-route control (speaker / earpiece).
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from "expo-audio";

export function useCallRecorder(): any {
  return useAudioRecorder(RecordingPresets.HIGH_QUALITY);
}

export async function setCallAudioMode(active: boolean, speaker: boolean) {
  try {
    await setAudioModeAsync({
      allowsRecording: active,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: active ? !speaker : false,
    } as any);
  } catch {}
}

export async function ensureMicPermission(): Promise<boolean> {
  try { const r = await requestRecordingPermissionsAsync(); return !!r.granted; } catch { return true; }
}
