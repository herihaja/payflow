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
    <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="card p-6 animate-fade-in">
        <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Batch #{id}
        </h2>

        {batch && (
          <div className="card p-6 sm:p-8 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  Filename
                </p>
                <p className="text-gray-900 font-semibold text-lg truncate">
                  {batch.original_filename}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  Status
                </p>
                <div
                  className={`badge text-sm font-bold ${
                    batch.status === "completed"
                      ? "badge-success"
                      : batch.status === "processing"
                      ? "badge-info"
                      : "badge-warning"
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2 bg-current"></span>
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 text-sm font-medium animate-slide-in flex items-start gap-3">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div>
          <h3 className="text-xl sm:text-2xl font-poppins font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Items
          </h3>
          {items.length === 0 ? (
            <div className="card p-8 sm:p-12 text-center">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 text-lg">No pending items</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <th className="text-left px-3 sm:px-6 py-4 text-xs sm:text-sm font-poppins font-bold text-blue-900 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="text-left px-3 sm:px-6 py-4 text-xs sm:text-sm font-poppins font-bold text-blue-900 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-left px-3 sm:px-6 py-4 text-xs sm:text-sm font-poppins font-bold text-blue-900 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-3 sm:px-6 py-4 text-xs sm:text-sm font-poppins font-bold text-blue-900 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((it, idx) => (
                      <tr
                        key={`item-${it.row_number}-${it.id}`}
                        className={`transition-colors duration-150 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50`}
                      >
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 font-semibold">
                          {it.id}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-800 font-mono tracking-tight">
                          {it.phone}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 font-semibold">
                          {it.amount}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                          <span
                            className={`badge text-xs font-bold ${
                              it.status === "success"
                                ? "badge-success"
                                : it.status === "processing"
                                ? "badge-info animate-pulse-soft"
                                : it.status === "failed"
                                ? "badge-danger"
                                : "badge-warning"
                            }`}
                          >
                            {it.status.charAt(0).toUpperCase() +
                              it.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
