"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import AuthBackButton from "@/app/components/AuthBackButton";

const FORGOT_PASSWORD_URL = `${process.env.NEXT_PUBLIC_DJANGO_ADMIN_PROTOCOL}://${process.env.NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN}/api/membership/forgot-password/`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await axios.post(FORGOT_PASSWORD_URL, { email });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate({ email });
  }

  return (
    <div className="auth-page-bg relative">
      <AuthBackButton />
      <div className="auth-card">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <h1 className="auth-heading">Forgot Password</h1>
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
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </button>
          {mutation.isError && (
            <div className="auth-error">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Request failed"}
            </div>
          )}
          {success && (
            <div className="auth-success">If this email exists, a reset link has been sent.</div>
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