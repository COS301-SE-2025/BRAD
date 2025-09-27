"use client"
import ProtectedLayout from "@/components/ProtectedLayout"

export default function InvestigatorLayout({ children }) {
  return (
    <ProtectedLayout allowedRoles={["investigator"]}>
      {children}
    </ProtectedLayout>
  )
}
