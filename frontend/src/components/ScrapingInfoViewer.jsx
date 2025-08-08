import React, { useState } from 'react';
import '../styles/ScrapingInfoViewer.css';

const ScrapingInfoViewer = ({ scrapingInfo }) => {
  const [activeTab, setActiveTab] = useState('structured');

  if (!scrapingInfo) return <p>No scraping data available.</p>;

  const tabs = [
    { id: 'structured', label: 'Structured Info' },
    { id: 'crawled', label: 'Crawled Links' },
    { id: 'raw', label: 'Raw HTML' },
    { id: 'screenshot', label: 'Screenshot' }
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
          <p className="scraping-flag-warning">⚠️ Obfuscated Scripts Detected</p>
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
          <p className="scraping-flag-info">⚠️ Meta Refresh Detected</p>
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
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const path = `/static/${scrapingInfo.screenshotPath}`;
    console.log("screenshotPath:", scrapingInfo.screenshotPath);
    console.log("Image URL:", `${baseUrl}${path}`);



    return (
      <div className="scraping-section">
        {scrapingInfo.screenshotPath ? (
          <img
            src={`${baseUrl}${path}`}
            alt="Screenshot"
            className="scraping-screenshot"
            onError={(e) => {
              e.target.onerror = null;
            }}
          />
        ) : (
          <p>No screenshot available.</p>
        )}
      </div>
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
      <h2>Scraping & Crawling Data</h2>

      {scrapingInfo.summary && (
        <div className="scraping-summary">
          <strong>Summary:</strong> {scrapingInfo.summary}
        </div>
      )}

      <div className="scraping-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </div>
  );
};

export default ScrapingInfoViewer;
