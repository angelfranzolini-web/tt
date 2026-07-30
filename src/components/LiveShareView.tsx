import { useEffect, useRef, useState } from "react";
import type { SharePayload } from "../shared/sharePayload";
import ShareView from "./ShareView";

interface Props {
  shareId: string;
}

type Status = "connecting" | "live" | "not-found";

export default function LiveShareView({ shareId }: Props) {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?shareId=${encodeURIComponent(shareId)}`);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; payload?: SharePayload };
          if (msg.type === "share-state" && msg.payload) {
            setPayload(msg.payload);
            setStatus("live");
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (cancelled) return;
        if (event.code === 4404) {
          setStatus("not-found");
          return;
        }
        retryTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [shareId]);

  if (status === "not-found") {
    return <div className="share-error">Ce lien de partage n'existe plus.</div>;
  }
  if (!payload) {
    return <div className="app-loading">Chargement du suivi partagé…</div>;
  }
  return <ShareView payload={payload} />;
}
