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
  confirmStyle = "btn-primary", // use global btn style
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="modal-card w-full max-w-md">
        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* Message */}
        <p className="modal-message mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={confirmStyle}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
