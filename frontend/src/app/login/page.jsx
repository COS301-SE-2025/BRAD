"use client";

import React, { useState, useEffect } from "react";
import AuthLayout from "../../components/AuthLayout";
import Notification from "../../components/Notification";
import API from "../../lib/api/axios";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";
import ForgotPasswordModal from "../../components/ForgotPasswordModal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(null);
  const [error, setError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = login, 2 = verify OTP
  const [tempToken, setTempToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Step 1: Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      console.log("Sending login request:", { identifier: username }); // ✅ Log request
      const response = await API.post("/auth/login", {
        identifier: username,
        password,
      });
      console.log("API Response:", JSON.stringify(response.data, null, 2)); // ✅ Detailed response log

      const { tempToken, token, message, user } = response.data;

      if (tempToken) {
        console.log("Received tempToken, switching to OTP step"); // ✅ Log OTP flow
        setTempToken(tempToken);
        setStep(2);
        setNotify({ type: "success", title: "OTP Sent", message });
      } else if (token && user) {
        console.log("Received token, performing direct login"); // ✅ Log direct login
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
      } else {
        console.warn("No token received, response:", response.data); // ✅ Log error case
        setError("Login failed: no token received.");
      }
    } catch (err) {
      console.error("Login error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      }); // ✅ Detailed error logging
      if (err.response?.data?.message) {
        setError(err.response.data.message); // Display specific backend error
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError("Please enter the OTP code.");
      return;
    }

    try {
      setLoading(true);

      console.log("Sending OTP verification:", { tempToken, otp, rememberMe }); // ✅ Log OTP request
      const response = await API.post("/auth/verify-otp", {
        tempToken,
        otp,
        rememberMe,
      });
      console.log("Verify OTP response:", response.data); // ✅ Log response

      const { user, token } = response.data;

      if (!token) {
        setError("No JWT returned from server.");
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
      console.error("OTP verification error:", err.response?.data, err); // ✅ Log errors
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("OTP verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "B.R.A.D | Login";
  }, []);

  return (
    <AuthLayout>
      <BackButton />
      <div>
        <h3 className="text-xl font-semibold mb-2">
          {step === 1 ? "Sign in to your account" : "Verify OTP"}
        </h3>
        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">
          {step === 1
            ? "Enter your username and password to continue."
            : "Enter the 6-digit code sent to your email."}
        </p>

        {error && (
          <div className="mb-4">
            <Notification
              type="error"
              title="Error"
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

        {step === 1 ? (
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
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brad-500 underline"
              >
                Forgot password?
              </button>
            </div>

            {showForgotPassword && (
              <ForgotPasswordModal
                onClose={() => setShowForgotPassword(false)}
              />
            )}

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
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                One-Time Password (OTP)
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-2 rounded-md border focus:ring-2 focus:ring-brad-300 input tracking-widest text-center"
                placeholder="123456"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 rounded-md btn-primary disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Verifying…" : "Verify OTP"}
              </button>
            </div>

            <div className="text-center text-sm">
              Didn’t get the code?{" "
              }
              <button
                type="button"
                className="text-brad-500 underline"
                onClick={() => handleLogin({ preventDefault: () => {} })}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-xs text-gray-600 dark:text-gray-400">
          By logging in you agree to our{" "}
          <a href="/B.R.A.D-User-Manual.pdf" className="text-brad-500 underline">
            Terms & Privacy
          </a>
          .
        </div>
      </div>
    </AuthLayout>
  );
}