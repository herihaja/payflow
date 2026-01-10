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
      className="w-full sm:w-auto card p-6 sm:p-8 animate-fade-in"
    >
      <h3 className="text-xl font-poppins font-bold text-gray-900 mb-6 text-center">
        Sign In
      </h3>
      <div className="space-y-4">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            className="w-full"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full gradient-button mt-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse-soft">●</span> Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </div>
      {error && (
        <div className="text-red-600 text-sm font-medium mt-4 bg-red-50 p-4 rounded-xl border border-red-200 animate-slide-in">
          ⚠️ {error}
        </div>
      )}
    </form>
  );
}
