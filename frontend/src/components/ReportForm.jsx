"use client";
import React, { useState } from "react";
import { Upload, File, Image as ImageIcon, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import API from "@/lib/api/axios";

export default function ReportForm({ setNotification }) {
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const MAX_FILES = 5;

  const showNotification = (type, message) => {
    if (setNotification) {
      setNotification({ type, title: type === "success" ? "Success" : "Error", message });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleFileChange = (e) => {
    if (loading) return; // prevent changes while loading
    const newFiles = Array.from(e.target.files);
    const combined = [...files, ...newFiles];
    if (combined.length > MAX_FILES) {
      showNotification("error", "You can only attach up to 5 files.");
      setFiles(combined.slice(0, MAX_FILES));
    } else {
      setFiles(combined);
    }
  };

  const handleRemoveFile = (index) => {
    if (loading) return; // prevent removing files while loading
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return showNotification("error", "Please enter a domain/URL");

    setLoading(true);
    const formData = new FormData();
    formData.append("domain", url);
    formData.append("submittedBy", user?._id);

    files.forEach((file) => {
      formData.append("evidence", file);
    });

    try {
      await API.post("/report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUrl("");
      setFiles([]);
      showNotification("success", "Report submitted successfully!");
    } catch (err) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to submit report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* URL Input */}
      <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">
        Enter URL to report
      </label>
      <div className="flex items-center border rounded-lg px-3 py-2 mb-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <LinkIcon className="h-5 w-5 text-gray-500 mr-2" />
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200"
          required
          disabled={loading} // disabled while loading
        />
      </div>

      {/* File Upload */}
      <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">
        Attach optional evidence
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (loading) return;
          e.preventDefault();
          const droppedFiles = Array.from(e.dataTransfer.files);
          const combined = [...files, ...droppedFiles];
          if (combined.length > MAX_FILES) {
            showNotification("error", "You can only attach up to 5 files.");
            setFiles(combined.slice(0, MAX_FILES));
          } else {
            setFiles(combined);
          }
        }}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={loading} // prevent selecting new files
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-8 w-8 text-gray-500 mb-2" />
          <span className="text-gray-600 dark:text-gray-400">
            Drag & drop or click to upload
          </span>
        </label>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <ul className="mt-4 text-left space-y-2">
          {files.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 mr-2" />
                ) : (
                  <File className="h-4 w-4 mr-2" />
                )}
                {file.name}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                className="ml-2 text-red-500 hover:text-red-700"
                disabled={loading} // cannot remove files while loading
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Submit Button with Loading */}
      <button
        type="submit"
        className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
        ) : null}
        {loading ? "Reporting..." : "Submit Report"}
      </button>
    </motion.form>
  );
}
