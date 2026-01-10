import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import BatchUploader from "./components/BatchUploader";
import Login from "./components/Login";
import BatchDetail from "./components/BatchDetail";
import Welcome from "./components/Welcome";

function ProtectedRoute({ element, auth }) {
  return auth ? element : <Navigate to="/" replace />;
}

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 transition"
            >
              PayFlow
            </Link>
          </h1>
          <div className="w-full sm:w-auto">
            {auth ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                <span className="text-sm sm:text-base text-gray-700">
                  Signed in as{" "}
                  <strong className="text-gray-900">
                    {auth.fullname ?? auth.username}
                  </strong>
                </span>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2"
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
          <Route
            path="/batches/:id"
            element={<ProtectedRoute element={<BatchDetail />} auth={auth} />}
          />
        </Routes>
      </div>
    </div>
  );
}
