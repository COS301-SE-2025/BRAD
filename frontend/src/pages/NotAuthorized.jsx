import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NotAuthorized.css";

const NotAuthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="not-authorized-container">
      <h1>🚫 Access Denied</h1>
      <p>You don’t have permission to view this page.</p>
      <button onClick={() => navigate("/")}>Go Home</button>
      <button onClick={() => navigate("/login")}>Login</button>
    </div>
  );
};

export default NotAuthorized;
