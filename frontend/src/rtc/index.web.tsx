// Web WebRTC layer: uses the browser's RTCPeerConnection / getUserMedia and
// renders media through real <video>/<audio> elements via react-native-web.
import React, { useEffect, useRef } from "react";
import { StyleProp, ViewStyle } from "react-native";

const g: any = typeof window !== "undefined" ? window : {};

export const rtcAvailable: boolean = !!(g.RTCPeerConnection && g.navigator?.mediaDevices?.getUserMedia);
export const unavailableReason: string | null = rtcAvailable
  ? null
  : "This browser doesn't support WebRTC calls (or the page isn't served over HTTPS).";

export async function getUserMedia(constraints: any): Promise<any> {
  return g.navigator.mediaDevices.getUserMedia(constraints);
}

export function createPeerConnection(config: any): any {
  return new g.RTCPeerConnection(config);
}

export const canSwitchCamera = false;
export function switchCamera(_stream: any) {}

function MediaEl({ tag, stream, style, mirror, muted }: { tag: "video" | "audio"; stream: any; style?: any; mirror?: boolean; muted?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { unstable_createElement } = require("react-native-web");
  const ref = useRef<any>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream || null;
    if (stream) el.play?.().catch(() => {});
  }, [stream]);
  return unstable_createElement(tag, {
    ref,
    autoPlay: true,
    playsInline: true,
    muted: !!muted,
    style: [style, { objectFit: "cover" } as any, mirror ? { transform: [{ scaleX: -1 }] } : null],
  });
}

type VideoProps = { stream: any; style?: StyleProp<ViewStyle>; mirror?: boolean; zOrder?: number };
export function RTCVideoView({ stream, style, mirror }: VideoProps) {
  // Video elements are always muted here; audio is played by <RemoteAudio/> so
  // voice and video calls share one audio path.
  return <MediaEl tag="video" stream={stream} style={style} mirror={mirror} muted />;
}

export function RemoteAudio({ stream }: { stream: any }) {
  if (!stream) return null;
  return <MediaEl tag="audio" stream={stream} style={{ width: 0, height: 0, opacity: 0 }} />;
}
