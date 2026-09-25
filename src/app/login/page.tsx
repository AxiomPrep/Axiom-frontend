"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthChange, refreshSession, signInWithEmail, signOut, signUpWithEmail, type AxiomUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-paths";
import { getAccessToken, setAccessToken } from "@/lib/session";
import { PageHeader, Shell } from "@/components/ui";
import {
  CLASS_LEVELS,
  EXAM_INTEREST_LABELS,
  EXAM_INTERESTS,
  classLabel,
  isValidPhone,
  type ClassLevel,
  type ExamInterest,
} from "@/lib/student-profile";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<AxiomUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [classLevel, setClassLevel] = useState<ClassLevel>("12");
  const [examInterests, setExamInterests] = useState<ExamInterest[]>(["jee"]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);

  useEffect(() => {
    const stop = onAuthChange(setUser);
    void refreshSession();
    return stop;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = safeNextPath(params.get("next"));
    const token = getAccessToken();
    if (token && params.get("google") !== "ok") {
      setAccessToken(token);
      router.replace(destination);
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = safeNextPath(params.get("next"));
    if (params.get("google") === "ok") {
      void refreshSession().then((next) => {
        window.history.replaceState({}, "", "/login");
        if (next) router.push(destination);
        else {
          setErrorMessage(
            "Google confirmed your account, but the Axiom Prep API did not issue a session token. Use email sign-in, or ask the backend to accept Google id_token on /api/auth/google.",
          );
        }
      });
      return;
    }
    if (params.get("error") === "google_redirect") {
      setErrorMessage(
        "Google rejected this app’s redirect URL. In Google Cloud → Credentials → your OAuth client, add exactly http://localhost:3000/auth/google/callback under Authorized redirect URIs, then try again.",
      );
    } else if (params.get("error") === "google_api") {
      setErrorMessage(
        "Google sign-in worked, but the Axiom Prep API did not accept that account. Sign in with email, or expose a Google token exchange on the backend.",
      );
    } else if (params.get("error") === "google") {
      setErrorMessage("Google sign-in did not complete. Close the tab and try Google again.");
    }
  }, []);
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!isValidPhone(phone)) {
          setErrorMessage("Enter a 10-digit Indian mobile number.");
          return;
        }
        if (examInterests.length === 0) {
          setErrorMessage("Pick at least one exam interest: JEE, NEET, or Olympiad.");
          return;
        }
        const { user: created, error, needsEmailConfirmation } = await signUpWithEmail({
          email,
          password,
          full_name: fullName,
          phone,
          class_level: classLevel,
          exam_interests: examInterests,
        });
        if (error) {
          setErrorMessage(error);
          return;
        }
        if (needsEmailConfirmation) {
          setPendingConfirmEmail(email);
          return;
        }
        if (created) {
          setSuccessMessage("Account created. Welcome to Axiom Prep.");
          setTimeout(() => router.push(safeNextPath(new URLSearchParams(window.location.search).get("next"))), 900);
        }
      } else {
        const { user: signedIn, error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(error);
          return;
        }
        if (signedIn) {
          setSuccessMessage("Signed in. Redirecting…");
          setTimeout(() => router.push(safeNextPath(new URLSearchParams(window.location.search).get("next"))), 900);
        }
      }
    } catch {
      setErrorMessage("Authentication encountered an unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.assign("/auth/google");
  };

  if (pendingConfirmEmail) {
    return (
      <Shell>
        <div className="mx-auto max-w-md">
          <div className="surface rounded-2xl p-8 text-center">
            <p className="font-display text-lg italic text-axiom">Confirm your email</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Authenticate yourself</h1>
            <p className="mt-3 text-sm text-muted">
              We sent a confirmation link to <span className="text-ink">{pendingConfirmEmail}</span>.
              Open that mail and click <span className="text-ink">Confirm email address</span>, then sign in.
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              The mail comes from Supabase Auth until Axiom Prep SMTP is connected. Check spam if you do not see it.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="btn-primary h-11 text-sm"
                onClick={() => {
                  setPendingConfirmEmail(null);
                  setMode("signin");
                  setPassword("");
                  setErrorMessage(null);
                }}
              >
                I confirmed — sign in
              </button>
              <button
                type="button"
                className="btn-ghost h-11 text-sm"
                onClick={() => setPendingConfirmEmail(null)}
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (user) {
    return (
      <Shell>
        <div className="mx-auto max-w-md">
          <div className="surface rounded-2xl p-8 text-center">
            <p className="font-display text-lg italic text-axiom">Signed in</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome, {user.name}</h1>
            <p className="mt-2 text-sm text-muted">{user.email}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/practice" className="btn-primary h-11 text-sm">
                Continue to practice
              </Link>
              <button type="button" onClick={() => signOut()} className="btn-ghost h-11 text-sm">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={`mx-auto ${mode === "signup" ? "max-w-lg" : "max-w-md"}`}>
        <PageHeader
          eyebrow="Account"
          title={mode === "signin" ? "Welcome back." : "Start your trial."}
          subtitle={
            mode === "signup"
              ? "Tell us who you are, your class, and whether you are aiming for JEE, NEET, or Olympiad."
              : "Sign in with the Axiom Prep API. Your session is sent with every student request."
          }
        />
        <div className="surface rounded-2xl p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-full border border-line p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className={`h-9 rounded-full text-sm font-medium ${
                  mode === item ? "bg-axiom text-black" : "text-muted hover:text-ink"
                }`}
              >
                {item === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {successMessage ? (
            <p className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</p>
          ) : null}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Full name</span>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Phone</span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Class</span>
                  <select
                    required
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                    className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none"
                  >
                    {CLASS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {classLabel(level)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Exam interest</legend>
                  <div className="flex flex-wrap gap-2">
                    {EXAM_INTERESTS.map((interest) => {
                      const active = examInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() =>
                            setExamInterests((current) =>
                              current.includes(interest)
                                ? current.filter((item) => item !== interest)
                                : [...current, interest],
                            )
                          }
                          className={`h-10 rounded-full px-4 text-sm ${
                            active ? "bg-axiom text-black" : "border border-line text-muted hover:text-ink"
                          }`}
                        >
                          {EXAM_INTEREST_LABELS[interest]}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aspirant@axiom.app"
                className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
                Password
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="normal-case tracking-normal text-axiom">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary h-11 w-full text-sm disabled:opacity-60">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            <span className="h-px flex-1 bg-line" />
            or continue with
            <span className="h-px flex-1 bg-line" />
          </div>
          <button type="button" onClick={handleGoogle} className="btn-ghost h-11 w-full text-sm">
            Google
          </button>
          <p className="mt-6 text-center text-xs text-zinc-500">
            Email and Google both use the Axiom Prep API.
          </p>
        </div>
      </div>
    </Shell>
  );
}
