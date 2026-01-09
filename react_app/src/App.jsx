import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import BatchUploader from "./components/BatchUploader";
import Login from "./components/Login";
import BatchDetail from "./components/BatchDetail";
import Welcome from "./components/Welcome";

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");
    const fullname = localStorage.getItem("fullname");
    return token ? { token, username, fullname } : null;
  });

  useEffect(() => {
    if (auth && auth.token) {
      console.log("Logged in as", auth.username);
    }
  }, [auth]);

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("fullname");
    setAuth(null);
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            PayFlow
          </Link>
        </h1>
        <div>
          {auth ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#444" }}>
                Signed in as <strong>{auth.fullname ?? auth.username}</strong>
              </span>
              <button
                onClick={logout}
                style={{ marginLeft: 8, padding: "6px 10px" }}
              >
                Log out
              </button>
            </div>
          ) : (
            <Login onLogin={(a) => setAuth(a)} />
          )}
        </div>
      </div>

      <Routes>
        <Route path="/" element={auth ? <BatchUploader /> : <Welcome />} />
        <Route path="/batches/:id" element={<BatchDetail />} />
      </Routes>
    </div>
  );
}
