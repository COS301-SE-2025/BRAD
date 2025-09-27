"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiLock } from "react-icons/fi" // lock icon

export default function NotAuthorized() {
  const router = useRouter()

  return (
    <div className="not-authorized-page flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Image
        src="/BRAD_robot.png"
        alt="BRAD Robot"
        width={200}
        height={200}
        className="mb-4"
      />
      <FiLock className="text-red-500 w-16 h-16 mb-4" /> {/* icon */}
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="mb-4">Sorry, you don’t have permission to view this page.</p>
      <button
        onClick={() => router.push('/login')}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Login
      </button>
    </div>
  )
}
