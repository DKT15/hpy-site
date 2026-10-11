import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

import "../../styles/AuthPage.css";

function getAuthUrlState() {
  const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));

  const queryParams = new URLSearchParams(window.location.search);

  const errorCode =
    hashParams.get("error_code") || queryParams.get("error_code");

  const errorDescription =
    hashParams.get("error_description") || queryParams.get("error_description");

  const recoveryType = hashParams.get("type") || queryParams.get("type");

  return {
    errorCode,
    errorDescription,
    indicatesRecovery: recoveryType === "recovery",
  };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [canReset, setCanReset] = useState(false);

  const [expired, setExpired] = useState(false);

  const [loadingSession, setLoadingSession] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  /* =======================================================
     VERIFY PASSWORD RECOVERY SESSION
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    let recoveryEventSeen = false;

    const { errorCode, errorDescription, indicatesRecovery } =
      getAuthUrlState();

    /* -----------------------------------------------------
       EXPIRED / INVALID OTP
       ----------------------------------------------------- */

    if (errorCode === "otp_expired") {
      setExpired(true);

      setError(errorDescription || "This password reset link has expired.");

      setLoadingSession(false);

      return undefined;
    }

    /* -----------------------------------------------------
       AUTH LISTENER

       PASSWORD_RECOVERY is the authoritative signal.

       SIGNED_IN / INITIAL_SESSION are only accepted when
       the URL itself also indicates a recovery flow.

       This prevents an ordinary signed-in user from simply
       visiting /reset-password and receiving the reset form.
       ----------------------------------------------------- */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryEventSeen = true;

        setCanReset(true);
        setExpired(false);
        setError("");
        setLoadingSession(false);

        return;
      }

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session &&
        indicatesRecovery
      ) {
        recoveryEventSeen = true;

        setCanReset(true);
        setExpired(false);
        setError("");
        setLoadingSession(false);
      }
    });

    /* -----------------------------------------------------
       EXISTING RECOVERY SESSION

       This supports recovery links where Supabase has
       already established the session before this component
       finishes mounting.
       ----------------------------------------------------- */

    async function checkRecoverySession() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        console.error("Could not verify recovery session:", sessionError);

        setCanReset(false);

        setError("We could not verify this password reset link.");

        setLoadingSession(false);

        return;
      }

      /*
        A normal authenticated session is NOT enough.

        We only accept the existing session when:
        - the recovery auth event has already been seen, or
        - the current URL explicitly identifies itself as
          a password recovery flow.
      */

      if (session && (recoveryEventSeen || indicatesRecovery)) {
        setCanReset(true);
        setExpired(false);
      } else if (!recoveryEventSeen) {
        setCanReset(false);
      }

      setLoadingSession(false);
    }

    checkRecoverySession();

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     UPDATE PASSWORD
     ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canReset) {
      setError("This password reset session is no longer valid.");

      return;
    }

    setSaving(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);

      setSaving(false);

      return;
    }

    setSuccess(true);
    setPassword("");
    setSaving(false);
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loadingSession) {
    return <AppLoading message="Checking your reset link..." />;
  }

  /* =======================================================
     EXPIRED / INVALID RECOVERY LINK
     ======================================================= */

  if (expired || !canReset) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />

            <span>Histopository</span>
          </Link>

          <div className="auth-heading">
            <p className="auth-kicker">RESET LINK</p>

            <h1>
              {expired ? "This link has expired" : "Reset link unavailable"}
            </h1>

            <p>
              {expired
                ? "Password reset links are temporary. Request a new one to continue."
                : "We could not verify this password reset link."}
            </p>
          </div>

          {error && <p className="auth-message error">{error}</p>}

          <div className="auth-signed-actions">
            <Link to="/login" className="auth-primary-link">
              Request a new reset link
            </Link>

            <Link to="/learn" className="auth-secondary-link">
              Continue as guest
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     SUCCESS
     ======================================================= */

  if (success) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />

            <span>Histopository</span>
          </Link>

          <div className="auth-success-icon">✓</div>

          <h1>Password updated</h1>

          <p>Your new password has been saved successfully.</p>

          <div className="auth-signed-actions">
            <Link to="/learn" className="auth-primary-link">
              Continue learning
            </Link>

            <Link to="/profile" className="auth-secondary-link">
              View profile
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     RESET FORM
     ======================================================= */

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <img src="/histopository-logo.png" alt="" />

          <span>Histopository</span>
        </Link>

        <div className="auth-heading">
          <p className="auth-kicker">ACCOUNT RECOVERY</p>

          <h1>Choose a new password</h1>

          <p>Enter a new password for your Histopository account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>

          <div className="auth-password-field">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="auth-message error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={saving}>
            {saving ? "Updating password..." : "Update password"}
          </button>
        </form>

        <div className="auth-switch">
          <Link to="/login" className="auth-text-button">
            ← Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
