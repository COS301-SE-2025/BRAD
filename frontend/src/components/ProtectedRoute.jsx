"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = typeof window !== "undefined"
      ? localStorage.getItem("user")
      : null;
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user || !user.token) {
      router.replace("/login");
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace("/not-authorized");
      return;
    }

    setAuthorized(true);
    setLoading(false);
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Checking access...</p>
      </div>
    );
  }

  return authorized ? children : null;
}
