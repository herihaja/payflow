import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Pusher from "pusher-js";

export default function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    "http://localhost:8000";
  const WS_BASE = import.meta.env.REACT_APP_WS_URL || "ws://localhost:6001";

  useEffect(() => {
    // Load batch details (including items)
    fetch(`${API_BASE}/api/batches/${id}/`)
      .then((r) => r.json())
      .then((d) => {
        setBatch(d);
        // show only non-success items by default
        setItems(d.items); //(d.items || []).filter((it) => it.status !== "success"));
      })
      .catch((e) => setError(e.message || String(e)));

    // Connect via Pusher protocol to Soketi (pusher-js)
    try {
      // Determine host/port from WS_BASE (which is an http:// url)
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
      } catch (e) {
        // fallback to defaults
      }

      const key =
        import.meta.env.VITE_SOKETI_KEY ||
        import.meta.env.REACT_APP_SOKETI_KEY ||
        "devkey";

      const cluster =
        import.meta.env.VITE_SOKETI_CLUSTER ||
        import.meta.env.REACT_APP_SOKETI_CLUSTER ||
        "mt1";

      // Create a Pusher instance and connect to Soketi (Pusher-compatible)
      const useTLS =
        WS_BASE.startsWith("wss://") || WS_BASE.startsWith("https://");
      console.log(`use tls ${useTLS ? "yes" : "no"}`);

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
      wsRef.current = pusher;

      pusher.connection.bind("state_change", ({ current, previous }) => {
        console.log("Connection state changed:", previous, "->", current);
      });

      pusher.connection.bind("connected", () => {
        console.log("Pusher connected");
        setConnected(true);
      });

      pusher.connection.bind("disconnected", () => {
        console.log("Pusher disconnected");
        setConnected(false);
      });

      pusher.connection.bind("error", (err) => {
        console.error("Pusher connection error:", err);
      });

      const channel = pusher.subscribe(`batches.${id}`);
      console.log("Subscribing to channel:", `batches.${id}`);

      channel.bind_global((eventName, data) => {
        console.log("Global event:", eventName, data);
      });

      channel.bind("item_update", (m) => {
        try {
          // Some servers (like Soketi) may send the payload as a JSON string;
          // handle both object and string payloads.
          const payload = typeof m === "string" ? JSON.parse(m) : m;
          console.log(`data received via socket`, payload);
          const it =
            payload.item || (payload.data && payload.data.item) || payload;
          if (!it) {
            console.debug("item_update payload (no item):", payload);
            return;
          }
          if (it.batch && String(it.batch) !== String(id)) return;

          // If success -> remove item from current list
          // if (it.status === "success") {
          //   setItems((prev) => prev.filter((p) => p.id !== it.id));
          // } else {
          setItems((prev) => {
            const found = prev.find((p) => p.id === it.id);
            if (found) return prev.map((p) => (p.id === it.id ? it : p));
            return [...prev, it].sort((a, b) => a.id - b.id);
          });
          // }
        } catch (err) {
          console.error("item_update handler error", err);
        }
      });

      pusher.connection.bind("connected", () =>
        console.log("Pusher connected")
      );
      pusher.connection.bind("disconnected", () =>
        console.log("Pusher disconnected")
      );
    } catch (err) {
      console.error("Failed to connect Pusher/Soketi", err);
    }

    return () => {
      if (wsRef.current) {
        try {
          // If using pusher-js, unsubscribe and disconnect; otherwise attempt close()
          const p = wsRef.current;
          if (typeof p.unsubscribe === "function") {
            try {
              p.unsubscribe(`batches.${id}`);
            } catch (e) {}
            try {
              p.disconnect();
            } catch (e) {}
          } else if (typeof p.close === "function") {
            try {
              p.close();
            } catch (e) {}
          }
        } catch (e) {}
      }
    };
  }, [id]);

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Batch #{id}</h2>
      {batch && (
        <div style={{ marginBottom: 8 }}>
          <strong>File:</strong> {batch.original_filename} —{" "}
          <strong>Status:</strong> {batch.status}
        </div>
      )}

      {error && <div style={{ color: "#b00020" }}>Error: {error}</div>}

      <div style={{ marginTop: 8 }}>
        <h3>Pending / Processing Items</h3>
        {items.length === 0 ? (
          <div>No pending items.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #eee" }}
                >
                  Id
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #eee" }}
                >
                  Phone number
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #eee" }}
                >
                  amount
                </th>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid #eee" }}
                >
                  status
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={`item-${it.row_number}-${it.id}`}>
                  <td style={{ padding: "6px 8px" }}>{it.id}</td>
                  <td style={{ padding: "6px 8px" }}>{it.phone}</td>
                  <td style={{ padding: "6px 8px" }}>{it.amount}</td>
                  <td style={{ padding: "6px 8px" }}>{it.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
