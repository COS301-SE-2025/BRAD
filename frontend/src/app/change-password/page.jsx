"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "../../lib/api/auth";
import Notification from "../../components/Notification";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", OTP: "", newPassword: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await changePassword(form.username, form.OTP, form.newPassword);
      setSuccess(response.data.message);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-semibold mb-4">Change Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-md border input"
        />
        <input
          type="password"
          name="OTP"
          placeholder="One-Time Password"
          value={form.OTP}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-md border input"
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={form.newPassword}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-md border input"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-md border input"
        />
        <button type="submit" className="w-full py-2 rounded-md btn-primary" disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>

      {error && (
        <Notification type="error" title="Error" onClose={() => setError("")}>
          {error}
        </Notification>
      )}
      {success && (
        <Notification type="success" title="Success" onClose={() => setSuccess("")}>
          {success}
        </Notification>
      )}
    </div>
  );
}
