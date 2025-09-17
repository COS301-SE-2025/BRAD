"use client"

import { useRouter } from "next/navigation"
import { FaArrowLeft } from "react-icons/fa"

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center text-brad-500 hover:underline mb-4"
    >
      <FaArrowLeft className="mr-2" /> Back
    </button>
  )
}
