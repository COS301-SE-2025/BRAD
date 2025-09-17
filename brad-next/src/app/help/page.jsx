"use client"

import { useState } from "react"
import BackButton from "@/components/BackButton"
import FAQ from "@/components/FAQ"

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const role = "reporter"

  return (
    <main className="help-page">
      <div className="container">
        <BackButton />

        <div className="help-header">
          <h1>Hi, how can we help?</h1>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="help-description">
            <p>
              This page is here to help you understand how to use B.R.A.D., submit
              reports, and troubleshoot any issues. Use the search bar above to
              filter questions or scroll through our frequently asked topics.
            </p>

            <div className="contact-section">
              <div className="contact-item">
                📧 <a href="mailto:cos301.cap2@gmail.com">cos301.cap2@gmail.com</a>
              </div>
              <div className="contact-item">
                🔗{" "}
                <a
                  href="https://github.com/COS301-SE-2025/BRAD"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub Repo
                </a>
              </div>
              <div className="contact-item">
                📄{" "}
                <a
                  href="/B.R.A.D-User_Manual.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open User Manual
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Chat */}
        <FAQ searchTerm={searchTerm} role={role} />
      </div>
    </main>
  )
}
