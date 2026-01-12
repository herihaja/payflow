import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function BatchUploader() {
  const [fileName, setFileName] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [createdBatchId, setCreatedBatchId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Helpful for debugging in the browser console to confirm the component mounted
    console.log("BatchUploader mounted");
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setFileName(f ? f.name : null);
  };

  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setError("Select a file first");
      return;
    }

    setUploading(true);
    setError(null);

    // Determine API base (support Vite `VITE_API_URL` or legacy `REACT_APP_API_URL` envs)
    const API_BASE =
      import.meta.env.VITE_API_URL ||
      import.meta.env.REACT_APP_API_URL ||
      "http://localhost:8000";

    try {
      const fd = new FormData();
      fd.append("file", file);

      // Attach Token auth header if available in localStorage
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Token ${token}` } : undefined;

      const res = await fetch(`${API_BASE}/api/batches/`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || res.statusText || "Upload failed");
      }

      const data = await res.json();
      setCreatedBatchId(data.id);
      // clear selection
      setFile(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      // Redirect to batch detail page
      navigate(`/batches/${data.id}`);

      // navigate to the new batch page
      if (typeof navigate === "function") {
        navigate(`/batches/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-8 card p-6 sm:p-8 max-w-3xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-gray-900 flex items-center gap-2">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Batch Uploader
          </h2>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-6 leading-relaxed">
        Select an Excel file to upload batches. This will POST a multipart form
        as{" "}
        <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs text-gray-800">
          file
        </code>{" "}
        to{" "}
        <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs text-gray-800">
          /api/batches/
        </code>{" "}
        and auto-start processing.
      </p>

      <div className="space-y-4">
        <div className="input-group">
          <label
            htmlFor="file-upload"
            className="text-sm font-semibold text-gray-700"
          >
            Excel File
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full gradient-button-success"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">●</span> Uploading...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Upload
            </span>
          )}
        </button>
      </div>

      <div className="text-gray-700 text-sm mt-4">
        {fileName ? (
          <span className="text-emerald-600 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Selected: {fileName}
          </span>
        ) : (
          <span className="text-gray-500 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            </svg>
            No file selected
          </span>
        )}
      </div>

      {error && (
        <div className="text-red-700 text-sm font-medium bg-red-50 p-4 rounded-xl border-l-4 border-red-500 mt-4 animate-slide-in flex items-start gap-3">
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

      {createdBatchId && (
        <div className="text-emerald-700 text-sm font-medium bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500 mt-4 animate-slide-in">
          <span className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Batch created successfully!
          </span>
          <a
            href={`${API_BASE}/api/batches/${createdBatchId}/`}
            className="text-emerald-600 hover:text-emerald-800 font-semibold underline"
          >
            View batch #{createdBatchId}
          </a>
        </div>
      )}
    </div>
  );
}
