"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import AuthBackButton from "@/app/components/AuthBackButton";

const protocol = process.env.NEXT_PUBLIC_DJANGO_ADMIN_PROTOCOL || "http";
const domain = process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN || "localhost:3000";
const SIGN_IN_URL = `${protocol}://${domain}/api/membership/sign-in/`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await axios.post(SIGN_IN_URL, { username, password });
      return res.data;
    },
    onSuccess: (data, variables) => {
      setSuccess(true);
      if (data.token && variables.username) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", variables.username);
      }
      // Redirect after a short delay for UX
      setTimeout(() => {
        router.push("/");
      }, 500);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate({ username, password });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] font-sans relative">
      <AuthBackButton />
      <div className="auth-card">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-2">
            Golden Horde Login
          </h1>
          <div>
            <label className="auth-label">Username</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="auth-label">Password</label>
              <a
                href="/auth/forgot-password"
                className="text-yellow-400 hover:underline hover:text-yellow-300 transition text-xs"
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Logging in..." : "Login"}
          </button>
          {mutation.isError && (
            <div className="auth-error">
              {(mutation.error as AxiosError<{ non_field_errors?: string[] }>)?.response?.data?.non_field_errors?.[0] || 
               (mutation.error instanceof Error
                 ? mutation.error.message
                 : "Login failed")}
            </div>
          )}
          {success && (
            <div className="auth-success">Login successful!</div>
          )}
        </form>
      </div>
      <div className="mt-4 text-center">
        <span className="text-gray-400">Don&apos;t have an account?</span>{' '}
        <a
          href="/auth/sign-up"
          className="text-yellow-400 hover:underline hover:text-yellow-300 transition"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}