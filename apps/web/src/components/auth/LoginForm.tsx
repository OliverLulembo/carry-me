"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthSubmitButton,
  authInputClass,
} from "@/components/auth/AuthLayout";

type LoginFormProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierHint?: string;
  registerHref?: string;
  registerLabel?: string;
};

export function LoginForm({
  role,
  title,
  subtitle,
  identifierLabel,
  identifierPlaceholder,
  identifierHint,
  registerHref,
  registerLabel,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role, redirect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Sign in failed.");
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={title}
      subtitle={subtitle}
      footer={
        registerHref ? (
          <p>
            {registerLabel ?? "Need an account?"}{" "}
            <Link href={registerHref} className="font-semibold text-brand-primary hover:underline">
              Register here
            </Link>
          </p>
        ) : (
          <p>
            Accounts are provisioned by CarryMe operations.{" "}
            <Link href="/login" className="font-semibold text-brand-primary hover:underline">
              Other login options
            </Link>
          </p>
        )
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthError message={error} />
        <AuthField label={identifierLabel} htmlFor="identifier" hint={identifierHint}>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={identifierPlaceholder}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={authInputClass}
          />
        </AuthField>
        <AuthSubmitButton loading={loading}>Sign in</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
