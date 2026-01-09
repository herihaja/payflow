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
    <div
      style={{
        marginTop: 20,
        border: "2px dashed #f0ad4e",
        padding: 16,
        borderRadius: 8,
        maxWidth: 560,
        background: "#fffef7",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Batch Uploader</h2>
        <span
          style={{
            background: "#ff4d4f",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          DEBUG
        </span>
      </div>

      <p style={{ marginTop: 4, color: "#666" }}>
        Select an Excel file to upload batches. This will POST a multipart form
        as <code>file</code> to <code>/api/batches/</code> and auto-start
        processing.
      </p>

      <div
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "6px 12px",
            background: "#0069d9",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div style={{ marginTop: 8, color: "#444" }}>
        {fileName ? `Selected: ${fileName}` : "No file selected"}
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "#b00020" }}>Error: {error}</div>
      )}

      {createdBatchId && (
        <div style={{ marginTop: 8 }}>
          Batch created:{" "}
          <a href={`${API_BASE}/api/batches/${createdBatchId}/`}>
            View batch #{createdBatchId}
          </a>
        </div>
      )}
    </div>
  );
}
