"use client"
import React, { useState } from "react"
import { Upload, File, Image as ImageIcon, Link as LinkIcon } from "lucide-react"
import { motion } from "framer-motion"

export default function ReportForm() {
  const [url, setUrl] = useState("")
  const [files, setFiles] = useState([])

  const handleFileChange = (e) => {
    setFiles([...files, ...Array.from(e.target.files)])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Submitted:", { url, files })
  }

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
        />
      </div>

      {/* File Upload */}
      <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-2">
        Attach optional evidence
      </label>
      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
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
              className="flex items-center text-sm text-gray-700 dark:text-gray-300"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 mr-2" />
              ) : (
                <File className="h-4 w-4 mr-2" />
              )}
              {file.name}
            </li>
          ))}
        </ul>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
      >
        Submit Report
      </button>
    </motion.form>
  )
}
