import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../../styles/AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setError("");
    setPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) {
        setError(error.message);
      } else {
        setMessage("Password reset email sent. Check your inbox.");
      }

      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/learn`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        setMessage("Account created.");
      } else {
        setMessage(
          "Account created. Check your email to confirm your account.",
        );
      }

      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/learn";
    }

    setLoading(false);
  }

  if (session) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />
            <span>Histopository</span>
          </Link>

          <div className="auth-success-icon">✓</div>

          <h1>You&apos;re signed in</h1>

          <p>
            Continue learning, take today&apos;s challenge or view your
            progress.
          </p>

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

  const isForgot = mode === "forgot";
  const isSignup = mode === "signup";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <img src="/histopository-logo.png" alt="" />
          <span>Histopository</span>
        </Link>

        <div className="auth-heading">
          <p className="auth-kicker">
            {isForgot
              ? "ACCOUNT RECOVERY"
              : isSignup
                ? "JOIN HISTOPOSITORY"
                : "WELCOME BACK"}
          </p>

          <h1>
            {isForgot
              ? "Reset your password"
              : isSignup
                ? "Create your account"
                : "Log in"}
          </h1>

          <p>
            {isForgot
              ? "Enter your email and we’ll send you a password reset link."
              : isSignup
                ? "Save your progress, earn XP and build your history streak."
                : "Continue your learning journey."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>

          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          {!isForgot && (
            <>
              <label htmlFor="auth-password">Password</label>

              <div className="auth-password-field">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
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
            </>
          )}

          {mode === "login" && (
            <button
              type="button"
              className="auth-text-button auth-forgot"
              onClick={() => changeMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="auth-message error">{error}</p>}

          {message && <p className="auth-message success">{message}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isForgot
                ? "Send reset link"
                : isSignup
                  ? "Create account"
                  : "Log in"}
          </button>
        </form>

        <div className="auth-switch">
          {isForgot ? (
            <button
              type="button"
              className="auth-text-button"
              onClick={() => changeMode("login")}
            >
              ← Back to login
            </button>
          ) : isSignup ? (
            <>
              <span>Already have an account?</span>

              <button
                type="button"
                className="auth-text-button"
                onClick={() => changeMode("login")}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              <span>New to Histopository?</span>

              <button
                type="button"
                className="auth-text-button"
                onClick={() => changeMode("signup")}
              >
                Create an account
              </button>
            </>
          )}
        </div>

        <Link to="/learn" className="auth-guest-link">
          Continue as guest →
        </Link>
      </section>
    </main>
  );
}
