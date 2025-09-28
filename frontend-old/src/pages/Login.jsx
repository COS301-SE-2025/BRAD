import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import BRAD_robot from "../assets/BRAD_robot.png";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import API from "../api/axios";
import BackButton from "../components/BackButton";

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false); 
  const [lockoutMessage, setLockoutMessage] = useState(""); 
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const lines = [
    "Welcome back!",
    "Ready to continue your journey with B.R.A.D? Log in to get started.",
  ];

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
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
        navigate("/investigator/stats");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response && err.response.data?.message) {
        const message = err.response.data.message;
        setError(message);

        // Check for lockout-specific errors
        if (message.includes("Account is locked") || message.includes("Account locked due to too many failed login attempts")) {
          setIsLocked(true);
          setLockoutMessage(message);
        }
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  useEffect(() => {
    document.title = "B.R.A.D | Login";

    if (currentLine < lines.length) {
      if (currentText.length < lines[currentLine].length) {
        const timeout = setTimeout(() => {
          setCurrentText(lines[currentLine].slice(0, currentText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setDisplayedLines((prev) => [...prev, lines[currentLine]]);
          setCurrentLine(currentLine + 1);
          setCurrentText("");
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentLine, currentText]);

  return (
    <div className="login-page">
      <BackButton />
      <div className="robot-section">
        <img src={BRAD_robot} alt="BRAD Robot" className="brad-robot" />
        <h2 className="welcome-message">
          {displayedLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {currentLine < lines.length && (
            <div>
              {currentText}
              <span className="cursor"></span>
            </div>
          )}
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
              setIsLocked(false); 
              setLockoutMessage("");
            }}
            disabled={isLocked} 
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setIsLocked(false); 
              setLockoutMessage("");
            }}
            disabled={isLocked} 
          />
          <button type="submit" disabled={isLocked}>
            {isLocked ? "Account Locked" : "Login"}
          </button>
          {error && (
            <div className="error">
              {lockoutMessage || error}
              {isLocked && (
                <p>
                  Check your email for a password reset link or try again later.
                  <br />
                  <button
                    className="link-button"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Request another reset link
                  </button>
                </p>
              )}
            </div>
          )}
        </form>

        <div className="auth-links">
          <button
            className="forgotPass-button"
            onClick={() => setShowForgotPassword(true)}
            disabled={isLocked} // Disable during lockout
          >
            Forgot Password?
          </button>
          <p className="register-link">
            Don't have an account?{" "}
            <button
              className="link-button"
              onClick={() => navigate("/register")}
              disabled={isLocked} // Disable during lockout
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