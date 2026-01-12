import React, { useEffect, useState, useRef } from "react";

import { useParams } from "react-router-dom";
import { createPusherClient } from "../services/pusherClient";
import { useBatchRealtimeItems } from "../hooks/useBatchRealtimeItems";
import BatchFilters from "./BatchFilters";

export default function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingItems, setLoadingItems] = useState(false);
  const [pusher, setPusher] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    phone: "",
    minAmount: null,
    maxAmount: null,
  });

  // infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef(null);

  const REALTIME_STATUSES = ["processing"];

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    "http://localhost:8000";
  const WS_BASE = import.meta.env.REACT_APP_WS_URL || "ws://localhost:6001";

  useBatchRealtimeItems({
    pusher,
    batchId: id,
    filters,
    setItems,
    setBatch,
  });

  useEffect(() => {
    // Load batch details (metadata only)
    fetch(`${API_BASE}/api/batches/${id}/`)
      .then((r) => r.json())
      .then((d) => {
        setBatch(d);
      })
      .catch((e) => setError(e.message || String(e)));

    const shouldConnect = REALTIME_STATUSES.includes(batch?.status);

    if (!shouldConnect) {
      // ensure socket is closed if batch is done
      if (pusher) {
        pusher.disconnect();
        setPusher(null);
      }
      return;
    }

    // Already connected → nothing to do
    if (pusher) return;

    // 🔌 Create connection
    const instance = createPusherClient({
      onConnected: () => {
        console.log("Pusher connected");
        setConnected(true);
      },
      onDisconnected: () => {
        console.log("Pusher disconnected");
        setConnected(false);
      },
      onError: (err) => {
        console.error("Pusher error", err);
      },
    });

    setPusher(instance);

    return () => {
      instance.disconnect();
    };
  }, [batch?.status, id]);

  // Fetch paginated items (supports append for infinite scroll)
  async function fetchItems(p = 1, psize = pageSize, filters, append = false) {
    setLoadingItems(true);
    try {
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams();
      params.set("page", p);
      params.set("page_size", psize);
      if (filters.status) params.set("status", filters.status);
      if (filters.phone) params.set("phone", filters.phone);
      if (filters.minAmount) params.set("min_amount", filters.minAmount);
      if (filters.maxAmount) params.set("max_amount", filters.maxAmount);

      const headers = token
        ? { Authorization: `Token ${token}`, Accept: "application/json" }
        : { Accept: "application/json" };

      const res = await fetch(
        `${API_BASE}/api/batches/${id}/items/?${params.toString()}`,
        { headers }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.detail || res.statusText || "Failed to load items"
        );
      }

      const data = await res.json();
      const pageResults = data.results || [];

      if (append) {
        setItems((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const merged = prev.concat(pageResults.filter((r) => !ids.has(r.id)));
          return merged;
        });
      } else {
        setItems(pageResults);
      }

      setHasMore(p * psize < (data.count || 0));
      setPage(p);
      setPageSize(psize);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoadingItems(false);
    }
  }

  // Refetch when pagination or filters change
  useEffect(() => {
    // if page > 1 we are loading more pages (append), otherwise replace
    const append = page > 1;
    fetchItems(page, pageSize, filters, append);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  // setup intersection observer for infinite scroll
  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loadingItems) {
          setTimeout(() => {
            setPage((p) => p + 1);
          }, 300);
        }
      });
    });

    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [bottomRef, hasMore, loadingItems]);

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                  Uploaded by
                </p>
                <p className="text-gray-900 font-semibold text-lg truncate">
                  {batch.uploaded_by?.full_name}
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

          <BatchFilters
            filters={filters}
            setFilters={setFilters}
            setPage={setPage}
          />

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
              <p className="text-gray-500 text-lg">No items found</p>
            </div>
          ) : (
            <>
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

              <div className="mt-4 text-sm text-gray-600 text-center">
                {loadingItems && <div>Loading items...</div>}
                {!hasMore && !loadingItems && (
                  <div>All items loaded ({items.length})</div>
                )}
                <div ref={bottomRef} className="h-6" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
