"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import AuthBackButton from "@/app/components/AuthBackButton";

const protocol = process.env.NEXT_PUBLIC_DJANGO_ADMIN_PROTOCOL || "http";
const domain = process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN || "localhost:3000";
const RESET_PASSWORD_URL = `${protocol}://${domain}/api/membership/reset-password/`;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ token, new_password }: { token: string; new_password: string }) => {
      const res = await axios.post(RESET_PASSWORD_URL, { token, new_password });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    const { token } = await params;
    mutation.mutate({ token, new_password: password });
  }

  return (
    <div className="auth-page-bg relative">
      <AuthBackButton />
      <div className="auth-card">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <h1 className="auth-heading">Reset Password</h1>
          <div>
            <label className="auth-label">New Password</label>
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
            {mutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
          {mutation.isError && (
            <div className="auth-error">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Reset failed"}
            </div>
          )}
          {success && (
            <div className="auth-success">Password reset successful! Redirecting to login...</div>
          )}
        </form>
      </div>
      <div className="mt-4 text-center">
        <a
          href="/auth"
          className="auth-link"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
} 