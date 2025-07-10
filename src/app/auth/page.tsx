"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function AuthPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("token");
    setUsername(storedUsername);
    setToken(storedToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    router.push("/auth/sign-in");
  };

  if (!username || !token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] font-sans">
        <div className="bg-gradient-to-br from-[#18181b] to-[#23272f] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800 text-white backdrop-blur-md">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-6">
            Not Logged In
          </h1>
          <p className="text-gray-300 text-center mb-6">
            Please sign in to view your account information.
          </p>
          <div className="space-y-3">
            <a
              href="/auth/sign-in"
              className="block w-full bg-yellow-400 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-300 transition text-center"
            >
              Sign In
            </a>
            <a
              href="/auth/sign-up"
              className="block w-full border border-yellow-400 text-yellow-400 py-2 rounded font-semibold hover:bg-yellow-400 hover:text-gray-900 transition text-center"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] font-sans">
      {/* Header Bar */}
      <header className="w-full flex justify-end items-center px-6 py-4 bg-transparent absolute top-0 left-0">
        <Link
          href="/"
          className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-yellow-300 transition shadow"
          aria-label="Go to App"
        >
          <span className="hidden sm:inline">Go to App</span>
          <FiArrowRight className="text-xl" />
        </Link>
      </header>
      <div className="bg-gradient-to-br from-[#18181b] to-[#23272f] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800 text-white backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-6">
          Account Information
        </h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <div className="bg-black/60 border border-gray-700 rounded px-3 py-2 text-white">
              {username}
            </div>
          </div>
          <div>
            <Link
              href="/auth/forgot-password"
              className="block w-full bg-yellow-400 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-300 transition text-center mt-2"
            >
              Reset Password
            </Link>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
