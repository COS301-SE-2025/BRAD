"use client";

import React from "react";
import Logo from "./Logo";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* LEFT column: hero */}
        <div className="space-y-6 p-6">
          <div className="p-6 card border border-transparent">
            <Logo size={96} />
            <h2 className="mt-6 text-3xl font-bold text-brad-600 dark:text-brad-200">Welcome to B.R.A.D</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Securely report suspicious domains — our bot analyzes and creates forensic reports for investigators.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Fast domain analysis</li>
              <li>• Secure sandbox bot</li>
              <li>• Forensic reports & dashboards</li>
            </ul>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400">
            Need help? <a className="text-brad-500 underline" href="/B.R.A.D-User-Manual.pdf" target="_blank">View user manual</a>
          </div>
        </div>

        {/* RIGHT column: card (login form) */}
        <div className="p-6 card">
          {children}
        </div>
      </div>
    </div>
  );
}
