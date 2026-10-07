import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../../styles/AuthPage.css";
import "../../styles/AppLoading.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [canReset, setCanReset] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace("#", ""));

    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");

    if (errorCode === "otp_expired") {
      setExpired(true);
      setError(
        errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "This password reset link has expired.",
      );
      setLoadingSession(false);
      return;
    }

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setCanReset(true);
      }

      setLoadingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        if (session) {
          setCanReset(true);
          setExpired(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

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

  if (loadingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />
            <span>Histopository</span>
          </Link>

          <div className="app-loading-spinner" />

          <h1>Checking your reset link</h1>

          <p>Please wait a moment.</p>
        </section>
      </main>
    );
  }

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
