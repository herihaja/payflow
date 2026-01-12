import React, { useState, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";

const BatchFilters = ({ filters, setFilters, setPage }) => {
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [phoneFilter, setPhoneFilter] = useState(filters.phone || "");
  const [minAmount, setMinAmount] = useState(filters.minAmount || "");
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount || "");

  // Create a debounced version of setFilters
  const debouncedSetFilters = useMemo(
    () =>
      debounce((partialFilters) => {
        setFilters((prev) => ({
          ...prev,
          ...partialFilters,
        }));
        setPage(1);
      }, 300),
    [setFilters, setPage]
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: statusFilter,
    }));
    setPage(1);
  }, [statusFilter]);

  // Watch for changes and call the debounced function
  useEffect(() => {
    debouncedSetFilters({
      phone: phoneFilter,
      minAmount,
      maxAmount,
    });

    // Cancel debounce on unmount
    return () => {
      debouncedSetFilters.cancel();
    };
  }, [phoneFilter, minAmount, maxAmount, debouncedSetFilters]);

  // Reset all filters
  const handleReset = () => {
    setStatusFilter("");
    setPhoneFilter("");
    setMinAmount("");
    setMaxAmount("");
    setFilters({
      status: "",
      phone: "",
      minAmount: null,
      maxAmount: null,
    });
    setPage(1);
    debouncedSetFilters.cancel();
  };

  return (
    <div className="mb-4 flex flex-col md:flex-row gap-3 items-center flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
          }}
          className="input"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Phone</label>
        <input
          value={phoneFilter}
          onChange={(e) => {
            setPhoneFilter(e.target.value);
          }}
          placeholder="Search phone"
          className="input"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Min Amount</label>
        <input
          type="number"
          step="0.01"
          value={minAmount}
          onChange={(e) => {
            setMinAmount(e.target.value);
          }}
          placeholder="0.00"
          className="input w-28"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Max Amount</label>
        <input
          type="number"
          step="0.01"
          value={maxAmount}
          onChange={(e) => {
            setMaxAmount(e.target.value);
          }}
          placeholder="0.00"
          className="input w-28"
        />
      </div>

      {/* Reset button */}
      <div className="flex items-center">
        <button
          onClick={handleReset}
          className="bg-blue-200 hover:bg-blue-300 text-blue-800 font-medium px-4 rounded h-12 flex items-center justify-center"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default BatchFilters;
