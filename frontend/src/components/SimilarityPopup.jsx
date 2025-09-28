"use client";
import React, { useState } from "react";

const SimilarityPopup = ({ isOpen, onClose, similarityResults, report }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Filter out self-comparisons first
  const cleanedResults = similarityResults.filter(
    (result) => result.domain !== report.domain
  );

  // Then filter by search term
  const filteredResults = cleanedResults.filter((result) =>
    result.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        className="modal-card w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Similarity Results</h2>
          <button
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Filter by domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input mb-4"
        />

        {/* Content */}
        {filteredResults.length > 0 ? (
          filteredResults.map((result, index) => (
            <div
              key={index}
              className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
            >
              <p className="text-lg">
                Compared to:{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  {result.domain}
                </strong>
              </p>

              <h1 className="text-4xl font-extrabold text-red-600 mt-2 mb-4">
                Final Score: {result.finalScore.toFixed(2)}
              </h1>

              {/* Lexical Section */}
              <h3 className="text-md font-semibold mt-4">Lexical Features</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>
                  Suspicious Score:{" "}
                  <span className="font-medium">
                    {result.lexical.suspicious_score.toFixed(2)}
                  </span>
                </li>
                <li>Dice: <span className="font-medium">{result.lexical.dice.toFixed(2)}</span></li>
                <li>Levenshtein Norm: <span className="font-medium">{result.lexical.levenshtein_norm.toFixed(2)}</span></li>
                <li>NGram Jaccard: <span className="font-medium">{result.lexical.ngram_jaccard.toFixed(2)}</span></li>
                <li>LCS Ratio: <span className="font-medium">{result.lexical.lcs_ratio.toFixed(2)}</span></li>
                <li>Char Cosine: <span className="font-medium">{result.lexical.char_cosine.toFixed(2)}</span></li>
                <li>Token Jaccard: <span className="font-medium">{result.lexical.token_jaccard.toFixed(2)}</span></li>
                <li>Has Digit: <span className="font-medium">{result.lexical.has_digit ? "Yes" : "No"}</span></li>
                <li>Has Hyphen: <span className="font-medium">{result.lexical.has_hyphen ? "Yes" : "No"}</span></li>
                <li>Repeated Chars: <span className="font-medium">{result.lexical.repeated_chars ? "Yes" : "No"}</span></li>
                <li>TLD Diff: <span className="font-medium">{result.lexical.tld_diff ? "Yes" : "No"}</span></li>
                <li>SLD One Edit Away: <span className="font-medium">{result.lexical.sld_one_edit_away ? "Yes" : "No"}</span></li>
              </ul>

              {/* Pattern Section */}
              <h3 className="text-md font-semibold mt-4">Pattern Features</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Has Digit: <span className="font-medium">{result.pattern.hasDigit ? "Yes" : "No"}</span></li>
                <li>Has Hyphen: <span className="font-medium">{result.pattern.hasHyphen ? "Yes" : "No"}</span></li>
                <li>Repeated Chars: <span className="font-medium">{result.pattern.repeatedChars ? "Yes" : "No"}</span></li>
                <li>Subdomain Suspicious: <span className="font-medium">{result.pattern.subdomainSuspicious ? "Yes" : "No"}</span></li>
                <li>TLD Diff: <span className="font-medium">{result.pattern.tldDiff ? "Yes" : "No"}</span></li>
                <li>SLD Transposition: <span className="font-medium">{result.pattern.sldTransposition ? "Yes" : "No"}</span></li>
                <li>Leet Match: <span className="font-medium">{result.pattern.leetMatch ? "Yes" : "No"}</span></li>
                <li>SLD One Edit Away: <span className="font-medium">{result.pattern.sldOneEditAway ? "Yes" : "No"}</span></li>
                <li>Hyphen Removed Match: <span className="font-medium">{result.pattern.hyphenRemovedMatch ? "Yes" : "No"}</span></li>
                <li>Contains Known as Substring: <span className="font-medium">{result.pattern.containsKnownAsSubstring ? "Yes" : "No"}</span></li>
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No matching results.</p>
        )}
      </div>
    </div>
  );
};

export default SimilarityPopup;
