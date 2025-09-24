"use client"
import ProtectedLayout from "@/components/ProtectedLayout"

export default function AdminLayout({ children }) {
  return (
    <ProtectedLayout allowedRoles={["admin"]}>
      {children}
    </ProtectedLayout>
  )
}
