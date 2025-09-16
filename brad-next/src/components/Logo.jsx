"use client";

import Image from "next/image";
import React from "react";

export default function Logo({ size = 80 }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-${size} h-${size} relative`} style={{ width: size, height: size }}>
        <Image src="/BRAD_robot.png" alt="BRAD logo" fill style={{ objectFit: "contain" }} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-brad-600 dark:text-brad-300">B.R.A.D</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">Bot to Report Abusive Domains</div>
      </div>
    </div>
  );
}
