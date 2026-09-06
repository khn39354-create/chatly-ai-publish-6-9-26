// Native WebRTC layer (Android/iOS) backed by react-native-webrtc.
// The native module is loaded lazily so the app still boots inside Expo Go
// (where WebRTC is unavailable) and simply reports `rtcAvailable = false`.
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";

let rtc: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  rtc = require("react-native-webrtc");
} catch {
  rtc = null;
}

export const rtcAvailable: boolean = !!rtc;
export const unavailableReason: string | null = rtcAvailable
  ? null
  : "Audio & video need the installed Chatly app. Expo Go can't run WebRTC — use the APK / App Store build.";

export async function getUserMedia(constraints: any): Promise<any> {
  if (!rtc) throw new Error("webrtc-unavailable");
  return rtc.mediaDevices.getUserMedia(constraints);
}

export function createPeerConnection(config: any): any {
  if (!rtc) throw new Error("webrtc-unavailable");
  return new rtc.RTCPeerConnection(config);
}

export const canSwitchCamera = true;
export function switchCamera(stream: any) {
  try { stream?.getVideoTracks?.().forEach((t: any) => t._switchCamera?.()); } catch {}
}

type VideoProps = { stream: any; style?: StyleProp<ViewStyle>; mirror?: boolean; zOrder?: number };
export function RTCVideoView({ stream, style, mirror, zOrder }: VideoProps) {
  if (!rtc || !stream) return <View style={style} />;
  const RTCView = rtc.RTCView;
  return <RTCView streamURL={stream.toURL()} style={style} objectFit="cover" mirror={!!mirror} zOrder={zOrder ?? 0} />;
}

// On native, remote audio is played by the WebRTC engine automatically.
export function RemoteAudio(_props: { stream: any }) {
  return null;
}
