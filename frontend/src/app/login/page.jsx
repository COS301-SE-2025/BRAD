"use client";

import React, { useState, useEffect } from "react";
import AuthLayout from "../../components/AuthLayout";
import Notification from "../../components/Notification";
import API from "../../lib/api/axios";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        identifier: username,
        password,
      });

      const { user, token } = response.data;

      if (!token) {
        setError("No token returned from server");
        return;
      }

      localStorage.removeItem("user");
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: user._id,
          username: user.username,
          token: token,
          role: user.role,
        })
      );

      if (user.role === "investigator") {
        router.push("/investigator/dashboard");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/reporter/dashboard");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'B.R.A.D | Login';
  }, []);

  return (
    <AuthLayout>
      <BackButton />
      <div>
        <h3 className="text-xl font-semibold mb-2">Sign in to your account</h3>
        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">
          Enter your username and password to continue.
        </p>

        {error && (
          <div className="mb-4">
            <Notification
              type="error"
              title="Login Error"
              onClose={() => setError(null)}
            >
              {error}
            </Notification>
          </div>
        )}

        {notify && (
          <div className="mb-4">
            <Notification
              type={notify.type}
              title={notify.title}
              onClose={() => setNotify(null)}
            >
              {notify.message}
            </Notification>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input"
              placeholder="you@example.com or username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="form-checkbox" />
              Remember me
            </label>

            <a
              href="/reset-password"
              className="text-sm text-brad-500 underline"
            >
              Forgot password?
            </a>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 rounded-md btn-primary disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm">
            Don’t have an account yet?{" "}
            <a href="/register" className="text-brad-500 underline">
              Register
            </a>
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-600 dark:text-gray-400">
          By logging in you agree to our{" "}
          <a
            href="/B.R.A.D-User-Manual.pdf"
            className="text-brad-500 underline"
          >
            Terms & Privacy
          </a>
          .
        </div>
      </div>
    </AuthLayout>
  );
}
