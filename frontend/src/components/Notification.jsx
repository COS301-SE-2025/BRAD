"use client";

import React from "react";
import { X } from "lucide-react";

export default function Notification({ type = "info", title, children, onClose }) {
  const colors = {
    info: "bg-blue-50 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    success: "bg-green-50 text-green-800 dark:bg-green-900/60 dark:text-green-200",
    error: "bg-red-50 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  };

  return (
    <div className={`p-3 rounded-md flex items-start justify-between ${colors[type] || colors.info}`}>
      <div>
        {title && <div className="font-semibold">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      <button onClick={onClose} aria-label="Close notification" className="ml-4 p-1 rounded hover:bg-white/10">
        <X size={16} />
      </button>
    </div>
  );
}
