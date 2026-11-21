"use client";

import { authClient } from "@/lib/auth/client";
import type { AccountRole } from "@/lib/profiles";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Props = {
  role: AccountRole;
  onAuthenticated: (role: AccountRole, trainerSetupRequired: boolean) => void;
};

async function saveProfile(role: AccountRole): Promise<{ role: AccountRole; trainerSetupRequired: boolean }> {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const result = await response.json() as {
    error?: unknown;
    profile?: { role?: unknown };
    trainerSetupRequired?: unknown;
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

  if (result.profile.role !== role) {
    throw new Error(
      `This email is already set up as a ${result.profile.role}. Switch accounts to continue with a separate ${role} account.`,
    );
  }

  if (typeof result.trainerSetupRequired !== "boolean") {
    throw new Error("The server returned an invalid coach setup status.");
  }

  return { role: result.profile.role, trainerSetupRequired: result.trainerSetupRequired };
}

export default function AuthForm({ role, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    authClient.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setErrorMessage(error.message ?? "Could not load your session.");
          return;
        }

        setAccountEmail(data?.user?.email ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Could not load your session.");
      });

    return () => {
      active = false;
    };
  }, []);

  async function switchAccount() {
    setErrorMessage("");
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      setAccountEmail("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not switch accounts.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage("");

    try {
      if (accountEmail && (
        mode === "sign-up" || accountEmail.toLowerCase() !== email.trim().toLowerCase()
      )) {
        throw new Error(`You're signed in as ${accountEmail}. Switch accounts before using different credentials.`);
      }

      const result = mode === "sign-up"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const profile = await saveProfile(role);
      setAccountEmail(email.trim());
      onAuthenticated(profile.role, profile.trainerSetupRequired);
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
      if (accountEmail) {
        throw new Error(`You're signed in as ${accountEmail}. Switch accounts before continuing with Google.`);
      }

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
      {accountEmail && (
        <div className="signed-in-notice">
          <span>Currently signed in as <b>{accountEmail}</b></span>
          <button disabled={pending} onClick={switchAccount} type="button">Switch account</button>
        </div>
      )}
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
  showDashboard = true,
}: {
  onSignIn?: () => void;
  className?: string;
  showDashboard?: boolean;
}) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [trainerSetupRequired, setTrainerSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    authClient.getSession()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          throw new Error(error.message ?? "Could not load your session.");
        }
        if (!data?.user) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/profile");
        const result = await response.json() as {
          error?: unknown;
          profile?: { role?: unknown };
          trainerSetupRequired?: unknown;
        };
        if (!response.ok) {
          throw new Error(typeof result.error === "string" ? result.error : "Could not load your account.");
        }
        if (result.profile?.role !== "client" && result.profile?.role !== "trainer") {
          throw new Error("The server returned an invalid account profile.");
        }
        if (typeof result.trainerSetupRequired !== "boolean") {
          throw new Error("The server returned an invalid coach setup status.");
        }
        if (!active) return;

        setAccountRole(result.profile.role);
        setTrainerSetupRequired(result.trainerSetupRequired);
        setAuthenticated(true);
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
      setAccountRole(null);
      setTrainerSetupRequired(false);
      router.replace("/login");
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
        <>
          {showDashboard && accountRole && (
            <button
              className={className === "header-login" ? "header-login header-dashboard" : className}
              onClick={() => router.push(
                accountRole === "trainer"
                  ? trainerSetupRequired ? "/trainer/apply" : "/trainer/dashboard"
                  : "/dashboard",
              )}
              type="button"
            >
              {accountRole === "trainer" && trainerSetupRequired ? "Coach application" : "Dashboard"}
            </button>
          )}
          <button className={className} onClick={signOut} type="button">Switch account</button>
        </>
      ) : (
        <button className={className} onClick={onSignIn ?? (() => router.push("/login"))} type="button">Log in</button>
      )}
      {errorMessage && <span className="auth-error" role="alert">{errorMessage}</span>}
    </span>
  );
}
