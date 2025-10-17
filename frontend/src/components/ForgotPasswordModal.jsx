"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { forgotPassword } from "../lib/api/auth";
import Notification from "./Notification";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate email using regex whenever input changes
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setMessage("");
    setError("");
    setIsValidEmail(validateEmail(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSending(true);

    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setMessage(res.data?.message ?? "If this email exists, a reset link was sent.");
      setEmail("");
      setIsValidEmail(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Reset Password</h3>

        {message && (
          <div className="mb-3">
            <Notification type="success" title="Success" onClose={() => setMessage("")}>
              {message}
            </Notification>
          </div>
        )}
        {error && (
          <div className="mb-3">
            <Notification type="error" title="Error" onClose={() => setError("")}>
              {error}
            </Notification>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            required
            className={`w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input ${
              email && !isValidEmail ? "border-red-500 focus:ring-red-400" : ""
            }`}
            autoComplete="email"
          />

          {/* Show helper text for invalid emails */}
          {email && !isValidEmail && (
            <p className="text-xs text-red-500 -mt-2">
              Please enter a valid email address.
            </p>
          )}

          <button
            type="submit"
            disabled={!isValidEmail || sending}
            className="w-full py-2 rounded-md btn-primary disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-md btn-secondary disabled:opacity-60"
          disabled={sending}
        >
          Close
        </button>
      </div>
    </div>
  );

  if (mounted) {
    return createPortal(modal, document.body);
  }
  return null;
}
