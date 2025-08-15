import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import BRAD_robot from "../assets/BRAD_robot.png";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import API from "../api/axios";
import { useEffect } from "react";

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const response = await API.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          identifier: username,
          password,
        }
      );

      const { user, token } = response.data;

      if (!token) {
        setError("No token returned from server");
        return;
      }

      localStorage.removeItem("user"); // ensure clean state
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: user._id,
          username: user.username,
          token: response.data.token,
          role: user.role,
        })
      );

      if (user.role === "investigator") {
        navigate("/investigator/stats");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  useEffect(() => {
    document.title = "B.R.A.D | Login";
  }, []);

  return (
    <div className="login-page">
      <div className="robot-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
        <h2 className="welcome-message">
          Welcome back! Ready to continue your journey <br />
          with B.R.A.D? Log in to get started.
          <span className="cursor"></span>
        </h2>
      </div>

      <div className="form-section">
        <h2>Login to B.R.A.D</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
          <button type="submit">Login</button>
          {error && <div className="error">{error}</div>}
        </form>

        <div className="auth-links">
          <button
            className="forgotPass-button"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
          <p className="register-link">
            Don't have an account?{" "}
            <button
              className="link-button"
              onClick={() => navigate("/register")}
            >
              Register here
            </button>
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
};

export default LoginPage;
