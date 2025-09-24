"use client";

import React, { useState } from "react";
import { forgotPassword } from "../lib/api/auth";
import Notification from "./Notification";

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
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Reset Password</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-md btn-primary"
          >
            Send Reset Link
          </button>
        </form>

        {message && (
          <Notification type="success" title="Success" onClose={() => setMessage("")}>
            {message}
          </Notification>
        )}
        {error && (
          <Notification type="error" title="Error" onClose={() => setError("")}>
            {error}
          </Notification>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-md btn-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
