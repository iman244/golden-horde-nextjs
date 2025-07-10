"use client";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function AuthBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="absolute top-6 left-6 flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold text-lg"
      aria-label="Back"
    >
      <FiArrowLeft className="text-xl" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
} 