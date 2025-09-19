"use client"
import { motion } from "framer-motion"
import { useState } from "react"

const steps = [
  {
    title: "Submit URL & Evidence",
    description: "Enter the suspicious URL and optionally upload evidence files.",
    image: "/file-upload.png",
  },
  {
    title: "Bot Analysis",
    description: "Our bot analyzes the URL and scrapes for malware or threats.",
    image: "/analysing.png",
  },
  {
    title: "Investigator Review",
    description: "Investigators review the bot’s findings and your evidence to make a verdict.",
    image: '/magnifying-glass.png'
  },
  {
    title: "Report Resolved",
    description: "You will receive the final verdict and can view the resolved report.",
    image: '/file.svg',
  },
]

export default function ReportStepsCarousel() {
  const [current, setCurrent] = useState(0)

  const prev = () =>
    setCurrent((prev) => (prev === 0 ? steps.length - 1 : prev - 1))
  const next = () =>
    setCurrent((prev) => (prev === steps.length - 1 ? 0 : prev + 1))

  return (
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <img
          src={steps[current].image}
          alt={steps[current].title}
          className="mx-auto mb-4 h-20 w-20"
        />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {steps[current].title}
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {steps[current].description}
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prev}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Prev
        </button>
        <button
          onClick={next}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === current ? "bg-blue-600" : "bg-gray-400"
            }`}
          ></span>
        ))}
      </div>
    </div>
  )
}
