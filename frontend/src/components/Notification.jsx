import React, { useEffect } from "react";
import "../styles/Notification.css";

const Notification = ({ type = "info", message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`notification ${type}`}>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose}>✖</button>
    </div>
  );
};

export default Notification;
