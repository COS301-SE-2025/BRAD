"use client";

import React, { useState } from "react";
import { forgotPassword } from "../lib/api/auth";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3">Reset Password</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
              setError("");
            }}
            required
            className="w-full px-3 py-2 rounded-md border input"
          />
          <button type="submit" className="w-full py-2 rounded-md btn-primary">
            Send Reset Link
          </button>
        </form>
        {message && <p className="mt-2 text-green-600">{message}</p>}
        {error && <p className="mt-2 text-red-600">{error}</p>}
        <button
          className="mt-4 text-sm text-gray-600 underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
