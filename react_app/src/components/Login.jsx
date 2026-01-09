import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    "http://localhost:8000";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.detail || data.error || res.statusText || "Login failed"
        );
      }

      const { token, user } = await res.json();

      localStorage.setItem("authToken", token);
      const resolvedUsername = user.username || username;
      const resolvedFullname =
        user.full_name || user.fullname || user.name || "";
      localStorage.setItem("username", resolvedUsername);
      localStorage.setItem("fullname", resolvedFullname);
      if (onLogin)
        onLogin({
          username: resolvedUsername,
          token,
          fullname: resolvedFullname,
        });
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading} style={{ padding: "6px 12px" }}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
      {error && (
        <div style={{ color: "#b00020", marginLeft: 12 }}>Error: {error}</div>
      )}
    </form>
  );
}
