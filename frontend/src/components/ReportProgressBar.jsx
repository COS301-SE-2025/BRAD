"use client"
import React from "react"
import { Check } from "lucide-react"

export default function ReportProgressBar({ status }) {
  const stages = [
    { key: "Pending", label: "Pending" },
    { key: "In Progress", label: "In Progress" },
    { key: "Resolved", label: "Resolved" },
  ]

  const stageIndex =
    status === "Pending" ? 0 : status === "In Progress" ? 1 : 2

  return (
    <div className="flex flex-col items-center w-full mt-6 relative">
      {/* Stepper line background */}
      <div className="relative w-full flex items-center">
        {/* Base gray line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 dark:bg-gray-600 -translate-y-1/2 z-0"></div>

        {/* Active line */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-brad-500 -translate-y-1/2 z-0 transition-all duration-300"
          style={{
            width: `${(stageIndex / (stages.length - 1)) * 100}%`,
          }}
        ></div>

        {/* Circles */}
        {stages.map((stage, idx) => {
          const isCompleted = idx < stageIndex;
          const isCurrent = idx === stageIndex;

          return (
            <div key={stage.key} className="flex-1 flex justify-center relative">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full
                ${isCompleted ? "bg-brad-500 text-white" : ""}
                ${isCurrent ? "bg-brad-500 text-white font-bold" : ""}
                ${
                  !isCompleted && !isCurrent
                    ? "border-2 border-gray-400 bg-white dark:bg-gray-800 text-gray-500"
                    : ""
                }`}
              >
                {isCompleted ? <Check size={18} /> : idx + 1}
              </div>
            </div>
          );
        })}

      </div>

      {/* Labels under circles */}
      <div className="flex justify-between w-full mt-3 text-xs md:text-sm">
        {stages.map((stage, idx) => (
          <div key={stage.key} className="flex-1 flex justify-center">
            <p
              className={`text-center ${
                idx === stageIndex
                  ? "text-brad-500 font-semibold"
                  : "text-white-600 dark:text-white-400"
              }`}
            >
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
