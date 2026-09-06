// Web: no expo-audio recorder needed (MediaRecorder is used) and the browser
// controls audio routing.
export function useCallRecorder(): any {
  return null;
}

export async function setCallAudioMode(_active: boolean, _speaker: boolean) {}

export async function ensureMicPermission(): Promise<boolean> {
  return true;
}
