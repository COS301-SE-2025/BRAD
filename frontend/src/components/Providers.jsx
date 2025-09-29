"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

/**
 * Wrap app with ThemeProvider
 * defaultTheme: 'system' uses system setting; attribute='class' toggles 'dark' class on html
 */
export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
