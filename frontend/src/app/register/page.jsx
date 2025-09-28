"use client";

import React, { useState, useEffect } from "react";
import AuthLayout from "../../components/AuthLayout";
import Notification from "../../components/Notification";
import API from "../../lib/api/axios";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "general",
  });

  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
    setError("");
    setSuccess("");

    // Update password validations if password field is changed
    if (name === "password") {
      setPasswordValidations({
        minLength: value.length >= 6,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotify(null);

    // Check if all password validations are met
    if (
      !passwordValidations.minLength ||
      !passwordValidations.uppercase ||
      !passwordValidations.lowercase ||
      !passwordValidations.number ||
      !passwordValidations.specialChar
    ) {
      setNotify({
        type: "error",
        title: "Error",
        message: "Password does not meet all requirements.",
      });
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setNotify({
        type: "error",
        title: "Error",
        message: "Passwords do not match.",
      });
      setLoading(false);
      return;
    }

    try {
      const userData = { ...form };
      const response = await API.post("/auth/register", userData);
      setSuccess(response.data.message);
      setNotify({
        type: "success",
        title: "Success",
        message: "Registration successful! Redirecting to login...",
      });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err.response?.data?.message === "User with this email or username already exists.") {
        setNotify({
          type: "error",
          title: "Error",
          message: "This email or username is already taken. Please try another.",
        });
      } else if (err.response?.data?.message) {
        setNotify({
          type: "error",
          title: "Error",
          message: err.response.data.message,
        });
      } else {
        setNotify({
          type: "error",
          title: "Error",
          message: "Registration failed. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "B.R.A.D | Register";
  }, []);

  return (
    <AuthLayout>
      <BackButton />
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <h3 className="text-lg font-semibold mb-1 text-center">
            Create your account
          </h3>
          <p className="text-xs mb-4 text-gray-600 dark:text-gray-300 text-center">
            Fill in your details to register.
          </p>

          {notify && (
            <div className="mb-3">
              <Notification
                type={notify.type}
                title={notify.title}
                onClose={() => setNotify(null)}
              >
                {notify.message}
              </Notification>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">First Name</label>
              <input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="John"
                autoComplete="given-name"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">Last Name</label>
              <input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="Choose a username"
                autoComplete="username"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="ml-24 text-xs">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                <li className={passwordValidations.minLength ? "text-green-500" : "text-red-500"}>
                  At least 6 characters
                </li>
                <li className={passwordValidations.uppercase ? "text-green-500" : "text-red-500"}>
                  At least one uppercase letter
                </li>
                <li className={passwordValidations.lowercase ? "text-green-500" : "text-red-500"}>
                  At least one lowercase letter
                </li>
                <li className={passwordValidations.number ? "text-green-500" : "text-red-500"}>
                  At least one number
                </li>
                <li className={passwordValidations.specialChar ? "text-green-500" : "text-red-500"}>
                  At least one special character
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-xs font-medium">Confirm</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="flex-1 px-2 py-1 rounded-md border input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-md btn-primary disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Registering…" : "Register"}
              </button>
            </div>

            <div className="text-center text-xs">
              Already have an account?{" "}
              <a href="/login" className="text-brad-500 underline">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}