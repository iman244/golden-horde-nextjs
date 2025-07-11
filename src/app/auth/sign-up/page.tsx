"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import AuthBackButton from "@/app/components/AuthBackButton";

const SIGN_UP_URL = `https://${process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN}/api/membership/sign-up/`;

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      const res = await axios.post(SIGN_UP_URL, { username, email, password });
      return res.data;
    },
    onSuccess: (data, variables) => {
      setSuccess(true);
      if (data.token && variables.username) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", variables.username);
      }
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 500);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate({ username, email, password });
  }

  return (
    <div className="auth-page-bg relative">
      <AuthBackButton />
      <div className="auth-card">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <h1 className="auth-heading">Sign Up</h1>
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
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing up..." : "Sign Up"}
          </button>
          {mutation.isError && (
            <div className="auth-error">
              {(() => {
                const err = mutation.error as AxiosError<Record<string, string[]>>;
                const data = err?.response?.data;
                if (data && typeof data === "object") {
                  const firstKey = Object.keys(data)[0];
                  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey][0]) {
                    return data[firstKey][0];
                  }
                }
                return mutation.error instanceof Error
                  ? mutation.error.message
                  : "Sign up failed";
              })()}
            </div>
          )}
          {success && (
            <div className="auth-success">Sign up successful!</div>
          )}
        </form>
      </div>
      <div className="mt-4 text-center">
        <span className="auth-muted">Already have an account?</span>{' '}
        <a
          href="/auth/sign-in"
          className="auth-link"
        >
          Login
        </a>
      </div>
    </div>
  );
}
