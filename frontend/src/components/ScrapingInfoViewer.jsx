import React, { useState } from 'react';
import '../styles/ScrapingInfoViewer.css';

const ScrapingInfoViewer = ({ scrapingInfo }) => {
  const [activeTab, setActiveTab] = useState('structured');

  if (!scrapingInfo) return <p>No scraping data available.</p>;

  const tabs = [
    { id: 'structured', label: 'Structured Info' },
    { id: 'crawled', label: 'Crawled Links' },
    { id: 'raw', label: 'Raw HTML' },
    { id: 'screenshot', label: 'Screenshot' },
  ];

  const renderStructured = () => {
    const {
      headings = [],
      links = [],
      forms = [],
      redFlags = {}
    } = scrapingInfo.structuredInfo || {};

    return (
      <>
        <p><strong>Headings:</strong> {headings.join(', ') || 'None'}</p>
        <p><strong>Links:</strong> {links.length}</p>
        <p><strong>Forms:</strong> {forms.length}</p>

        <p><strong>Red Flags:</strong></p>
        {redFlags.suspiciousJS?.length > 0 ? (
          <ul className="list-disc pl-5">
            {redFlags.suspiciousJS.map((code, i) => (
              <li key={i}><code>{code}</code></li>
            ))}
          </ul>
        ) : <p>None</p>}

        {redFlags.obfuscatedScripts && (
          <p className="text-red-600">⚠️ Obfuscated Scripts Detected</p>
        )}

        {redFlags.redirectChain?.length > 0 && (
          <div>
            <p><strong>Redirect Chain:</strong></p>
            <ul className="list-disc pl-5">
              {redFlags.redirectChain.map((url, i) => (
                <li key={i}>{url}</li>
              ))}
            </ul>
          </div>
        )}

        {redFlags.usesMetaRefresh && (
          <p className="text-yellow-600">⚠️ Meta Refresh Detected</p>
        )}

        {redFlags.suspiciousInlineEvents?.length > 0 && (
          <div>
            <p><strong>Suspicious Inline Events:</strong></p>
            <ul className="list-disc pl-5">
              {redFlags.suspiciousInlineEvents.map((evt, i) => (
                <li key={i}><code>{evt}</code></li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  const renderCrawledLinks = () => (
    <ul className="list-disc pl-5">
      {scrapingInfo.crawledLinks?.map((link, i) => (
        <li key={i}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
      ))}
    </ul>
  );

  const renderRawHtml = () => (
    <pre className="bg-gray-900 text-white text-sm p-3 overflow-auto max-h-96 rounded">
      <code>{scrapingInfo.htmlRaw || 'No HTML available.'}</code>
    </pre>
  );

  const renderScreenshot = () => (
    scrapingInfo.screenshotPath ? (
      <img
      src={`http://localhost:3000${scrapingInfo.screenshotPath}`}
      alt="Screenshot"
      className="max-w-full border rounded"
    />
    ) : (
      <p>No screenshot available.</p>
    )
  );

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
    <div className="mt-6 border border-gray-300 p-4 rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-3">Scraping & Crawling Data</h2>

      {scrapingInfo.summary && (
        <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 border border-yellow-400 rounded">
          <strong>Summary:</strong> {scrapingInfo.summary}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-3 py-1 rounded transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{renderActiveTab()}</div>
    </div>
  );
};

export default ScrapingInfoViewer;
