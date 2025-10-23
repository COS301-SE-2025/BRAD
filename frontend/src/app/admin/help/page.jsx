"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import BackButton from "@/components/BackButton"
import FAQ from "@/components/FAQ"
import Sidebar from "@/components/Sidebar"

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const pathname = usePathname()
  const [role, setRole] = useState("reporter") // default
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Derive role from URL
  useEffect(() => {
    if (pathname.startsWith("/investigator")) {
      setRole("investigator")
    } else if (pathname.startsWith("/reporter")) {
      setRole("reporter")
    } else if (pathname.startsWith("/admin")) {
      setRole("admin")
    }
  }, [pathname])

  useEffect(() => {
    document.title = 'B.R.A.D | Help Page';
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Sidebar onToggle={setSidebarExpanded} />

      <main
        className={`transition-all duration-300 w-full ${
          sidebarExpanded ? "ml-56" : "ml-16"
        }`}
      >
        <div className="p-6">
          <BackButton />

          <div className="help-header mt-6">
            <h1 className="text-3xl font-bold text-[var(--text)] mb-4">Hi, how can we help?</h1>
            
            <div className="max-w-2xl mb-6">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="help-description max-w-4xl">
              <p className="text-[var(--text-secondary)] mb-6 text-lg">
                This page is here to help you understand how to use B.R.A.D., submit
                reports, and troubleshoot any issues. Use the search bar above to
                filter questions or scroll through our frequently asked topics.
              </p>

              <div className="contact-section grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="contact-item card p-4 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-2xl mb-2">📧</div>
                  <a 
                    href="mailto:cos301.cap2@gmail.com" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Email Support
                  </a>
                </div>
                
                <div className="contact-item card p-4 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-2xl mb-2">🔗</div>
                  <a
                    href="https://github.com/COS301-SE-2025/BRAD"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    GitHub Repository
                  </a>
                </div>
                
                <div className="contact-item card p-4 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-2xl mb-2">📄</div>
                  <a
                    href="/B.R.A.D-User-Manual.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    User Manual
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Chat - now role-based */}
          <div className="max-w-4xl">
            <FAQ searchTerm={searchTerm} role={role} />
          </div>
        </div>
      </main>
    </div>
  )
}