"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthSubmitButton,
  authInputClass,
} from "@/components/auth/AuthLayout";

export function PassengerRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register/passenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Registration failed.");
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your passenger account"
      subtitle="Load credits once, tap on any CarryMe bus, and skip the cash."
      footer={
        <p>
          Already riding with CarryMe?{" "}
          <Link href="/login/passenger" className="font-semibold text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthError message={error} />
        <AuthField label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Chanda Mwila"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Mobile number" htmlFor="phone" hint="Used for tap verification and credit sharing.">
          <input
            id="phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+260 97 700 0001"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            className={authInputClass}
          />
        </AuthField>
        <AuthSubmitButton loading={loading}>Create account & load wallet</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}

export function OwnerRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, businessName, phone, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Registration failed.");
      }
      router.push(data.redirect ?? "/owner/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Register your fleet"
      subtitle="List buses, invite drivers by email, and track earnings in one dashboard."
      footer={
        <p>
          Already an owner?{" "}
          <Link href="/login/owner" className="font-semibold text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthError message={error} />
        <AuthField label="Your name" htmlFor="fullName">
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Mr. Banda"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Business / fleet name" htmlFor="businessName">
          <input
            id="businessName"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Banda Minibus Services"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Business phone" htmlFor="phone">
          <input
            id="phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+260 97 700 0003"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Business email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="fleet@example.com"
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            className={authInputClass}
          />
        </AuthField>
        <AuthSubmitButton loading={loading}>Create owner account</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
