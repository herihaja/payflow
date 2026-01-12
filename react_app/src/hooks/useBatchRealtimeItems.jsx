import { useEffect, useRef } from "react";

export function useBatchRealtimeItems({
  pusher,
  batchId,
  filters,
  setItems,
  setBatch,
}) {
  const filtersRef = useRef(filters);

  // Keep ref updated with latest filters
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!pusher || !batchId) return;

    const channel = pusher.subscribe(`batches.${batchId}`);

    const itemHandler = (m) => {
      try {
        const payload = typeof m === "string" ? JSON.parse(m) : m;
        const it =
          payload.item || (payload.data && payload.data.item) || payload;

        if (!it) return;
        if (it.batch && String(it.batch) !== String(batchId)) return;

        setItems((prev) => {
          const f = filtersRef.current;
          const found = prev.find((p) => p.id === it.id);

          const min = f.minAmount ? Number(f.minAmount) : null;
          const max = f.maxAmount ? Number(f.maxAmount) : null;

          // Check if item matches all filters
          const matchesFilters =
            (!f.status || it.status === f.status) &&
            (!f.phone || it.phone.includes(f.phone)) &&
            (!min || Number(it.amount) >= min) &&
            (!max || Number(it.amount) <= max);

          if (found) {
            if (!matchesFilters) {
              // Remove item if it no longer matches filters
              return prev.filter((p) => p.id !== it.id);
            }
            // Update existing item
            return prev.map((p) => (p.id === it.id ? it : p));
          }

          // Add new item if it matches filters
          if (matchesFilters) {
            return [...prev, it];
          }

          return prev; // ignore if it doesn't match
        });
      } catch (err) {
        console.error("item_update handler error", err);
      }
    };

    const batchHandler = (data) => {
      setBatch((prev) =>
        prev ? { ...prev, status: data.batch.status } : prev
      );
    };

    channel.bind("item_update", itemHandler);
    channel.bind("batch_update", batchHandler);

    return () => {
      channel.unbind("item_update", itemHandler);
      channel.unbind("batch_update", batchHandler);
      pusher.unsubscribe(`batches.${batchId}`);
    };
  }, [pusher, batchId, setItems, setBatch]);
}
