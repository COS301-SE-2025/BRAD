// @/components/SimilarityPopup.jsx
"use client";
import React from "react";

const SimilarityPopup = ({ isOpen, onClose, similarityResults, report }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Filter out self-comparisons
  const filteredResults = similarityResults.filter((result) => result.domain !== report.domain);

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-100"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 hover:scale-[1.02]">
        <div className="relative">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Similarity Results</h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-2xl font-bold focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {filteredResults.length > 0 ? (
          filteredResults.map((result, index) => (
            <div key={index} className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-lg text-gray-700">Compared to: <strong className="text-blue-600">{result.domain}</strong></p>
              <h1 className="text-5xl text-red-600 font-extrabold mt-2 mb-4">Final Score: {result.finalScore.toFixed(2)}</h1>
              <h3 className="text-md font-semibold text-gray-800 mt-2">Lexical Features</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Suspicious Score: <span className="font-medium">{result.lexical.suspicious_score.toFixed(2)}</span></li>
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
              <h3 className="text-md font-semibold text-gray-800 mt-4">Pattern Features</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
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
          <p className="text-gray-500 italic">No similarity data available.</p>
        )}
      </div>
    </div>
  );
};

export default SimilarityPopup;