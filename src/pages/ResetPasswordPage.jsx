import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const errorCode = hashParams.get("error_code");

    if (errorCode === "otp_expired") {
      setMessage(
        "This password reset link has expired or has already been used. Please request a new one.",
      );
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN")
      ) {
        setReady(true);
      }
    });

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
      }
    }

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully.");
      setPassword("");
    }

    setLoading(false);
  }

  if (!ready) {
    return (
      <main>
        <h1>Reset password</h1>

        {message ? (
          <>
            <p>{message}</p>
            <Link to="/login">Return to login</Link>
          </>
        ) : (
          <p>Validating your password reset link...</p>
        )}
      </main>
    );
  }

  return (
    <main>
      <h1>Choose a new password</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password">New password</label>

          <div>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {message && (
        <>
          <p>{message}</p>

          {message === "Password updated successfully." && (
            <Link to="/login">Go to login</Link>
          )}
        </>
      )}
    </main>
  );
}
