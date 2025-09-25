"use client"
import ProtectedLayout from "@/components/ProtectedLayout"

export default function ReporterLayout({ children }) {
  return (
    <ProtectedLayout allowedRoles={["general"]}> {/* reporters are "general" */}
      {children}
    </ProtectedLayout>
  )
}
