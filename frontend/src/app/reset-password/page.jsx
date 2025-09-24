"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "../../lib/api/auth";
import Notification from "../../components/Notification";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing reset token in URL.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setMessage("Password has been reset. Redirecting to login...");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input"
        />
        <button type="submit" className="w-full py-2 rounded-md btn-primary">
          Reset Password
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
    </div>
  );
}
