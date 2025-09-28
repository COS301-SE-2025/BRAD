"use client";

import React from "react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700", 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="modal-overlay">
      <div className="modal-card w-full max-w-md p-6 rounded shadow-lg">
        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* Message */}
        <p className="modal-message mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 rounded px-4 py-2 hover:bg-gray-400"
          >
            {cancelText}
          </button>
          <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="btn-primary"
        >
          {confirmText}
        </button>
        </div>
      </div>
      </div>
    </div>
  );
}
