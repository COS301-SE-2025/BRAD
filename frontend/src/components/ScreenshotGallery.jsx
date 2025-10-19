"use client";
import { useEffect, useState } from "react";

export default function ScreenshotGallery({ screenshots = [] }) {
  const [enlargedIndex, setEnlargedIndex] = useState(null);

  if (!screenshots.length)
    return <div className="text-sm text-gray-500">No screenshots</div>;

  // Keyboard navigation for enlarged view
  useEffect(() => {
    if (enlargedIndex === null) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setEnlargedIndex(null);
      if (e.key === "ArrowRight")
        setEnlargedIndex((prev) => (prev + 1) % screenshots.length);
      if (e.key === "ArrowLeft")
        setEnlargedIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enlargedIndex, screenshots.length]);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Screenshots</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {screenshots.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt="screenshot"
            className="w-full h-36 object-contain rounded bg-neutral-100 cursor-pointer hover:opacity-80"
            loading="lazy"
            decoding="async"
            onError={() => console.warn("IMG ERR:", src)}
            onClick={() => setEnlargedIndex(idx)}
          />
        ))}
      </div>

      {enlargedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setEnlargedIndex(null)}
        >
          <button
            className="absolute left-6 text-white text-4xl font-bold hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setEnlargedIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
            }}
          >
            ‹
          </button>

          <img
            src={screenshots[enlargedIndex]}
            alt="enlarged screenshot"
            className="max-w-[90%] max-h-[90%] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-6 text-white text-4xl font-bold hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setEnlargedIndex((prev) => (prev + 1) % screenshots.length);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
