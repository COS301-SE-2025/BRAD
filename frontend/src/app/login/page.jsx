"use client";

import React, { useState } from "react";
import AuthLayout from "../../components/AuthLayout";
import Notification from "../../components/Notification";
import * as auth from "../../lib/api/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotify(null);

    try {
      // CALL BACKEND - do not change backend endpoint or behavior
      const data = await auth.login({ username, password });

      // backend might return an object like { success: true, role: 'investigator', token: '...' }
      // we can't assume exact shape: handle common cases:
      if (data?.success === false) {
        setNotify({ type: "error", title: "Login failed", message: data.message || "Invalid credentials" });
      } else {
        // optionally save token if backend returns one (ONLY if your backend expects tokens in client storage)
        if (data?.token) {
          // If backend expects cookies, this isn't necessary. Only set token when your backend uses token auth.
          try {
            localStorage.setItem("token", data.token);
          } catch (err) {
            // ignore storage errors
          }
        }

        setNotify({ type: "success", title: "Signed in", message: "Redirecting..." });

        // redirect based on role if backend provides it
        const role = data?.role || data?.user?.role || "reporter";
        if (role === "admin") router.push("/admin");
        else if (role === "investigator") router.push("/investigator");
        else router.push("/reporter");
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Network error";
      setNotify({ type: "error", title: "Login error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h3 className="text-xl font-semibold mb-2">Sign in to your account</h3>
        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">Enter your username and password to continue.</p>

        {notify && (
          <div className="mb-4">
            <Notification type={notify.type} title={notify.title} onClose={() => setNotify(null)}>
              {notify.message}
            </Notification>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

            <a href="/reset-password" className="text-sm text-brad-500 underline">Forgot password?</a>
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
            Don’t have an account yet? <a href="/register" className="text-brad-500 underline">Register</a>
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-600 dark:text-gray-400">
          By logging in you agree to our <a href="/B.R.A.D-User-Manual.pdf" className="text-brad-500 underline">Terms & Privacy</a>.
        </div>
      </div>
    </AuthLayout>
  );
}
