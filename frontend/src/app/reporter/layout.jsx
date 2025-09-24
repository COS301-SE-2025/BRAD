"use client"
import ProtectedLayout from "@/components/ProtectedLayout"

export default function ReporterLayout({ children }) {
  return (
    <ProtectedLayout allowedRoles={["reporter"]}> {/* reporters are "general" */}
      {children}
    </ProtectedLayout>
  )
}
