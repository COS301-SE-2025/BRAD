"use client";

import Image from "next/image";
import React from "react";

export default function Logo({ expanded, size = 40, showText = true }) {
  return (
    <div
      className={`flex items-center ${
        expanded ? "justify-start px-4" : "justify-center"
      } h-16`}
    >
      <Image src="/BRAD_robot.png" alt="BRAD" width={size} height={size} />
      {expanded && showText && (
        <span className="ml-2 font-bold text-lg whitespace-nowrap">B.R.A.D</span>
      )}
    </div>
  )
}
