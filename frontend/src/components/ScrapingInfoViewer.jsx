import React, { useState } from 'react';
import '../styles/ReportModal.css';
import { FaListAlt, FaLink, FaCode, FaImage, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ScrapingInfoViewer = ({ scrapingInfo }) => {
  const [activeTab, setActiveTab] = useState('structured');
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState("");

  if (!scrapingInfo) return <p className="no-analysis">No scraping data available.</p>;

  const tabs = [
    { id: 'structured', label: 'Structured Info', icon: <FaListAlt /> },
    { id: 'crawled', label: 'Crawled Links', icon: <FaLink /> },
    { id: 'raw', label: 'Raw HTML', icon: <FaCode /> },
    { id: 'screenshot', label: 'Screenshot', icon: <FaImage /> }
  ];

  const renderStructured = () => {
    const { headings = [], links = [], forms = [], redFlags = {} } = scrapingInfo.structuredInfo || {};
    return (
      <div className="scraping-section">
        <p><strong>Headings:</strong> {headings.join(', ') || 'None'}</p>
        <p><strong>Links:</strong> {links.length}</p>
        <p><strong>Forms:</strong> {forms.length}</p>
        {redFlags.suspiciousJS?.length > 0 ? (
          <ul>{redFlags.suspiciousJS.map((code, i) => <li key={i}><code>{code}</code></li>)}</ul>
        ) : <p>None</p>}
        {redFlags.obfuscatedScripts && <p className="scraping-flag-warning"><FaExclamationTriangle /> Obfuscated Scripts Detected</p>}
        {redFlags.redirectChain?.length > 0 && (
          <div>
            <p><strong>Redirect Chain:</strong></p>
            <ul>{redFlags.redirectChain.map((url, i) => <li key={i}>{url}</li>)}</ul>
          </div>
        )}
        {redFlags.usesMetaRefresh && <p className="scraping-flag-info"><FaInfoCircle /> Meta Refresh Detected</p>}
        {redFlags.suspiciousInlineEvents?.length > 0 && (
          <div>
            <p><strong>Suspicious Inline Events:</strong></p>
            <ul>{redFlags.suspiciousInlineEvents.map((evt, i) => <li key={i}><code>{evt}</code></li>)}</ul>
          </div>
        )}
      </div>
    );
  };

  const renderCrawledLinks = () => (
    <div className="scraping-section">
      <ul>{scrapingInfo.crawledLinks?.map((link, i) => (
        <li key={i}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
      ))}</ul>
    </div>
  );

  const renderRawHtml = () => (
    <div className="scraping-section scraping-html-section">
      <pre><code>{scrapingInfo.htmlRaw || 'No HTML available.'}</code></pre>
    </div>
  );

  const renderScreenshot = () => {
    // const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    // const baseUrl = import.meta.env.VITE_BACKEND_URL || "/api";
    const baseUrl = "/api";
    const path = `/static/${scrapingInfo.screenshotPath}`;
    const imageUrl = `${baseUrl}${path}`;

    return (
      <>
        <div className="scraping-section">
          {scrapingInfo.screenshotPath ? (
            <img
              src={imageUrl}
              alt="Screenshot"
              className="scraping-screenshot"
              onClick={() => { setActiveScreenshot(imageUrl); setShowScreenshotModal(true); }}
            />
          ) : <p>No screenshot available.</p>}
        </div>
        {showScreenshotModal && activeScreenshot && (
          <div className="modal-overlay" onClick={() => setShowScreenshotModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h4>Screenshot Preview</h4>
              <img src={activeScreenshot} alt="Screenshot Full" />
              <button className="close-button" onClick={() => setShowScreenshotModal(false)}>Close</button>
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
      {scrapingInfo.summary && <div className="scraping-summary"><FaInfoCircle /> {scrapingInfo.summary}</div>}
      <div className="scraping-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`scraping-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
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
