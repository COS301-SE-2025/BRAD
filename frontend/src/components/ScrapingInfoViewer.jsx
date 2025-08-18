import React, { useState } from 'react';
import '../styles/InvestigatorDashboard.css';
import {
  FaListAlt,
  FaLink,
  FaCode,
  FaImage,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

const ScrapingInfoViewer = ({ scrapingInfo }) => {
  const [activeTab, setActiveTab] = useState('structured');
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState("");

  if (!scrapingInfo) return <p>No scraping data available.</p>;

  const tabs = [
    { id: 'structured', label: 'Structured Info', icon: <FaListAlt /> },
    { id: 'crawled', label: 'Crawled Links', icon: <FaLink /> },
    { id: 'raw', label: 'Raw HTML', icon: <FaCode /> },
    { id: 'screenshot', label: 'Screenshot', icon: <FaImage /> }
  ];

  const renderStructured = () => {
    const {
      headings = [],
      links = [],
      forms = [],
      redFlags = {}
    } = scrapingInfo.structuredInfo || {};

    return (
      <div className="scraping-section">
        <p><strong>Headings:</strong> {headings.join(', ') || 'None'}</p>
        <p><strong>Links:</strong> {links.length}</p>
        <p><strong>Forms:</strong> {forms.length}</p>

        <p><strong>Red Flags:</strong></p>
        {redFlags.suspiciousJS?.length > 0 ? (
          <ul>
            {redFlags.suspiciousJS.map((code, i) => (
              <li key={i}><code>{code}</code></li>
            ))}
          </ul>
        ) : <p>None</p>}

        {redFlags.obfuscatedScripts && (
          <p className="scraping-flag-warning">
            <FaExclamationTriangle /> Obfuscated Scripts Detected
          </p>
        )}

        {redFlags.redirectChain?.length > 0 && (
          <div>
            <p><strong>Redirect Chain:</strong></p>
            <ul>
              {redFlags.redirectChain.map((url, i) => (
                <li key={i}>{url}</li>
              ))}
            </ul>
          </div>
        )}

        {redFlags.usesMetaRefresh && (
          <p className="scraping-flag-info">
            <FaInfoCircle /> Meta Refresh Detected
          </p>
        )}

        {redFlags.suspiciousInlineEvents?.length > 0 && (
          <div>
            <p><strong>Suspicious Inline Events:</strong></p>
            <ul>
              {redFlags.suspiciousInlineEvents.map((evt, i) => (
                <li key={i}><code>{evt}</code></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderCrawledLinks = () => (
    <div className="scraping-section">
      <ul>
        {scrapingInfo.crawledLinks?.map((link, i) => (
          <li key={i}>
            <a href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderRawHtml = () => (
    <div className="scraping-section">
      <pre>
        <code>{scrapingInfo.htmlRaw || 'No HTML available.'}</code>
      </pre>
    </div>
  );

  const renderScreenshot = () => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const path = `/static/${scrapingInfo.screenshotPath}`;
    const imageUrl = `${baseUrl}${path}`;

    //console.log("screenshotPath:", scrapingInfo.screenshotPath);
    //console.log("Image URL:", imageUrl);

    return (
      <>
        <div className="scraping-section">
          {scrapingInfo.screenshotPath ? (
            <img
              src={imageUrl}
              alt="Screenshot"
              className="scraping-screenshot"
              style={{
                cursor: "pointer",
                maxWidth: "250px",
                borderRadius: "5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}
              onClick={() => {
                setActiveScreenshot(imageUrl);
                setShowScreenshotModal(true);
              }}
              onError={(e) => {
                e.target.onerror = null;
              }}
            />
          ) : (
            <p>No screenshot available.</p>
          )}
        </div>

        {showScreenshotModal && activeScreenshot && (
          <div
            className="modal-overlay"
            onClick={() => setShowScreenshotModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "8px",
                maxWidth: "90%",
                maxHeight: "90%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <h4 style={{ marginBottom: "10px" }}>
                Screenshot Preview
              </h4>
              <img
                src={activeScreenshot}
                alt="Screenshot Full"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  borderRadius: "5px"
                }}
              />
              <button
                className="close-button"
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={() => setShowScreenshotModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'structured': return renderStructured();
      case 'crawled': return renderCrawledLinks();
      case 'raw': return renderRawHtml();
      case 'screenshot': return renderScreenshot();
      default: return null;
    }
  };

  return (
    <div className="scraping-info-viewer">
      <h2><FaListAlt /> Scraping & Crawling Data</h2>

      {scrapingInfo.summary && (
        <div className="scraping-summary">
          <FaInfoCircle /> {scrapingInfo.summary}
        </div>
      )}

      <div className="scraping-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </div>
  );
};

export default ScrapingInfoViewer;
