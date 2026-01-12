import Pusher from "pusher-js";

export function createPusherClient({
  onConnected,
  onDisconnected,
  onError,
  onStateChange,
} = {}) {
  const WS_BASE = import.meta.env.REACT_APP_WS_URL || "ws://localhost:6001";

  let host = "localhost";
  let port = 6001;

  try {
    const url = new URL(WS_BASE);
    host = url.hostname;
    port = url.port
      ? parseInt(url.port, 10)
      : url.protocol === "https:"
      ? 443
      : 80;
  } catch (_) {}

  const key =
    import.meta.env.VITE_SOKETI_KEY ||
    import.meta.env.REACT_APP_SOKETI_KEY ||
    "devkey";

  const cluster =
    import.meta.env.VITE_SOKETI_CLUSTER ||
    import.meta.env.REACT_APP_SOKETI_CLUSTER ||
    "mt1";

  const useTLS = WS_BASE.startsWith("wss://") || WS_BASE.startsWith("https://");

  const pusher = new Pusher(key, {
    cluster,
    wsHost: host,
    wsPort: port,
    encrypted: false,
    forceTLS: useTLS,
    enabledTransports: useTLS ? ["wss"] : ["ws"],
    disableStats: true,
    disabledTransports: ["xhr_streaming", "xhr_polling", "sockjs"],
  });

  Pusher.logToConsole = true;

  if (onStateChange) {
    pusher.connection.bind("state_change", onStateChange);
  }
  if (onConnected) {
    pusher.connection.bind("connected", onConnected);
  }
  if (onDisconnected) {
    pusher.connection.bind("disconnected", onDisconnected);
  }
  if (onError) {
    pusher.connection.bind("error", onError);
  }

  return pusher;
}
