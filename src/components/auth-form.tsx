"use client";

import { authClient } from "@/lib/auth/client";
import type { AccountRole } from "@/lib/profiles";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Props = {
  role: AccountRole;
  onAuthenticated: (role: AccountRole) => void;
};

async function saveProfile(role: AccountRole): Promise<AccountRole> {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const result = await response.json() as {
    error?: unknown;
    profile?: { role?: unknown };
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Verify your email or sign in before continuing.");
    }

    throw new Error(typeof result.error === "string" ? result.error : "Could not save your account.");
  }

  if (result.profile?.role !== "client" && result.profile?.role !== "trainer") {
    throw new Error("The server returned an invalid account profile.");
  }

  return result.profile.role;
}

export default function AuthForm({ role, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage("");

    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      onAuthenticated(await saveProfile(role));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function continueWithGoogle() {
    setPending(true);
    setErrorMessage("");

    try {
      const callbackURL = new URL("/auth/callback", window.location.origin);
      callbackURL.searchParams.set("role", role);
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackURL.toString(),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="auth-form">
      <form onSubmit={submit}>
        {mode === "sign-up" && (
          <label>
            Name
            <input
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
        )}
        <label>
          Email address
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <button className="button button-red button-full" disabled={pending} type="submit">
          {pending ? "PLEASE WAIT…" : mode === "sign-up" ? "CREATE ACCOUNT" : "SIGN IN"}
        </button>
      </form>
      <button className="social-button" disabled={pending} onClick={continueWithGoogle} type="button">
        <b>G</b> Continue with Google
      </button>
      <button
        className="auth-mode-toggle"
        disabled={pending}
        onClick={() => {
          setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
          setErrorMessage("");
        }}
        type="button"
      >
        {mode === "sign-up" ? "Already have an account? Sign in" : "New to Forge? Create an account"}
      </button>
    </div>
  );
}

export function SessionControl({
  onSignIn,
  className = "header-login",
}: {
  onSignIn?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    authClient.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMessage(error.message ?? "Could not load your session.");
        } else {
          setAuthenticated(Boolean(data?.user));
        }
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Could not load your session.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setErrorMessage("");
    try {
      const { error } = await authClient.signOut();
      if (error) {
        throw new Error(error.message);
      }

      setAuthenticated(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  return (
    <span className="session-control">
      {loading ? (
        <span className={className} aria-live="polite">Checking session…</span>
      ) : authenticated ? (
        <button className={className} onClick={signOut} type="button">Log out</button>
      ) : (
        <button className={className} onClick={onSignIn ?? (() => router.push("/login"))} type="button">Log in</button>
      )}
      {errorMessage && <span className="auth-error" role="alert">{errorMessage}</span>}
    </span>
  );
}
