import { useEffect, useRef, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import "../../styles/AuthPage.css";

const PENDING_GUEST_ATTEMPT_KEY = "histopository_pending_guest_lesson_attempt";

const PENDING_ATTEMPT_MAX_AGE = 24 * 60 * 60 * 1000;

/* =========================================================
   PENDING GUEST LESSON
   ========================================================= */

function getPendingGuestAttempt() {
  try {
    const raw = localStorage.getItem(PENDING_GUEST_ATTEMPT_KEY);

    if (!raw) {
      return null;
    }

    const attempt = JSON.parse(raw);

    const isValid =
      attempt?.version === 1 &&
      typeof attempt.lesson_slug === "string" &&
      attempt.lesson_slug.length > 0 &&
      Array.isArray(attempt.answers) &&
      attempt.answers.length > 0 &&
      typeof attempt.saved_at === "number";

    if (!isValid) {
      localStorage.removeItem(PENDING_GUEST_ATTEMPT_KEY);

      return null;
    }

    const isExpired = Date.now() - attempt.saved_at > PENDING_ATTEMPT_MAX_AGE;

    if (isExpired) {
      localStorage.removeItem(PENDING_GUEST_ATTEMPT_KEY);

      return null;
    }

    return attempt;
  } catch (storageError) {
    console.error("Could not read guest progress:", storageError);

    return null;
  }
}

function clearPendingGuestAttempt() {
  try {
    localStorage.removeItem(PENDING_GUEST_ATTEMPT_KEY);
  } catch (storageError) {
    console.error("Could not clear guest progress:", storageError);
  }
}

async function savePendingGuestProgress() {
  const attempt = getPendingGuestAttempt();

  if (!attempt) {
    return {
      status: "none",
      completion: null,
    };
  }

  /*
    Never trust a browser-stored score or XP.

    Only the submitted question/answer IDs are
    sent to Supabase. complete_lesson_quiz()
    calculates the score and XP server-side.
  */

  const { data, error } = await supabase.rpc("complete_lesson_quiz", {
    p_lesson_slug: attempt.lesson_slug,

    p_answers: attempt.answers,
  });

  if (error) {
    console.error("Could not save guest progress:", error);

    return {
      status: "error",
      error,
      completion: null,
    };
  }

  const completion = Array.isArray(data) ? data[0] : data;

  clearPendingGuestAttempt();

  return {
    status: "saved",
    completion,
    lessonName: attempt.lesson_name || "your lesson",
  };
}

/* =========================================================
   AUTH PAGE
   ========================================================= */

export default function AuthPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const wantsProgressHandoff = searchParams.get("saveProgress") === "1";

  const confirmedFromEmail = searchParams.get("confirmed") === "1";

  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState(initialMode);

  const [session, setSession] = useState(null);

  const [sessionLoading, setSessionLoading] = useState(true);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [handoffStatus, setHandoffStatus] = useState("idle");

  const [handoffError, setHandoffError] = useState("");

  const [handoffCompletion, setHandoffCompletion] = useState(null);

  const [handoffLessonName, setHandoffLessonName] = useState("");

  /*
    This ref is the frontend protection against
    React/auth events triggering the handoff twice.

    The database function now also has concurrency
    protection, so both layers are protected.
  */

  const handoffStarted = useRef(false);

  /* =======================================================
     SESSION
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);

      setSessionLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) {
        return;
      }

      setSession(currentSession);

      setSessionLoading(false);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     GUEST → ACCOUNT HANDOFF

     This is now the ONLY automatic place that calls
     complete_lesson_quiz after authentication.
     ======================================================= */

  useEffect(() => {
    async function performHandoff() {
      if (!session || !wantsProgressHandoff || handoffStarted.current) {
        return;
      }

      handoffStarted.current = true;

      const pendingAttempt = getPendingGuestAttempt();

      if (!pendingAttempt) {
        setHandoffStatus("none");

        return;
      }

      setHandoffStatus("saving");
      setHandoffError("");

      const result = await savePendingGuestProgress();

      if (result.status === "error") {
        setHandoffStatus("error");

        setHandoffError(
          "You're signed in, but we couldn't save your guest lesson result. Your result is still stored on this device so you can try again.",
        );

        return;
      }

      if (result.status === "saved") {
        setHandoffCompletion(result.completion);

        setHandoffLessonName(result.lessonName);

        setHandoffStatus("saved");

        return;
      }

      setHandoffStatus("none");
    }

    performHandoff();
  }, [session, wantsProgressHandoff]);

  /* =======================================================
     MODE
     ======================================================= */

  function changeMode(nextMode) {
    setMode(nextMode);

    setMessage("");
    setError("");
    setPassword("");
  }

  /* =======================================================
     RETRY HANDOFF
     ======================================================= */

  async function retryGuestProgressSave() {
    if (!wantsProgressHandoff) {
      return;
    }

    setHandoffStatus("saving");
    setHandoffError("");

    const result = await savePendingGuestProgress();

    if (result.status === "error") {
      setHandoffStatus("error");

      setHandoffError(
        "We still couldn't save your lesson result. Your pending result has been kept so you can try again.",
      );

      return;
    }

    if (result.status === "saved") {
      setHandoffCompletion(result.completion);

      setHandoffLessonName(result.lessonName);

      setHandoffStatus("saved");

      return;
    }

    setHandoffStatus("none");
  }

  /* =======================================================
     FORM SUBMIT
     ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setHandoffError("");

    /* -----------------------------------------------------
       FORGOT PASSWORD
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       SIGN UP
       ----------------------------------------------------- */

    if (mode === "signup") {
      const pendingAttempt = wantsProgressHandoff
        ? getPendingGuestAttempt()
        : null;

      /*
        Email confirmation now returns to /login,
        which restores the green-tick confirmation
        screen.

        If this signup came from a guest lesson,
        saveProgress=1 survives the email round trip.
      */

      const confirmationPath = pendingAttempt
        ? "/login?confirmed=1&saveProgress=1"
        : "/login?confirmed=1";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,

        options: {
          emailRedirectTo: `${window.location.origin}${confirmationPath}`,
        },
      });

      if (error) {
        setError(error.message);

        setLoading(false);

        return;
      }

      /*
        If email confirmation is disabled,
        Supabase can return a session immediately.

        We ONLY set the session here.

        We do NOT call complete_lesson_quiz here.
        The handoff effect above will handle it once.
      */

      if (data.session) {
        setSession(data.session);

        setLoading(false);

        return;
      }

      if (pendingAttempt) {
        setMessage(
          "Account created. Check your email to confirm your account. Your lesson result will be saved when you return.",
        );
      } else {
        setMessage(
          "Account created. Check your email to confirm your account.",
        );
      }

      setLoading(false);

      return;
    }

    /* -----------------------------------------------------
       LOGIN
       ----------------------------------------------------- */

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);

      setLoading(false);

      return;
    }

    if (data.session) {
      setSession(data.session);
    }

    setLoading(false);

    /*
      Normal login:
      continue straight to Learn.

      Explicit guest-progress login:
      stay here so the ONE handoff effect can save
      the result and show the green tick screen.
    */

    if (!wantsProgressHandoff) {
      navigate("/learn", {
        replace: true,
      });
    }
  }

  /* =======================================================
     SESSION INITIALISING
     ======================================================= */

  if (sessionLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />

            <span>Histopository</span>
          </Link>

          <p>Checking your account...</p>
        </section>
      </main>
    );
  }

  /* =======================================================
     SIGNED IN / CONFIRMATION SCREEN
     ======================================================= */

  if (session) {
    const resultSaved = handoffStatus === "saved";

    const resultSaving = handoffStatus === "saving";

    const resultFailed = handoffStatus === "error";

    let heading = "You're signed in";

    let description =
      "Continue learning, take today's challenge or view your progress.";

    if (confirmedFromEmail && !wantsProgressHandoff) {
      heading = "Your account is ready";

      description =
        "Your email has been confirmed and your Histopository account is ready to use.";
    }

    if (resultSaving) {
      heading = "Finishing your account";

      description =
        "Your account is ready. We're securely saving the lesson you completed as a guest.";
    }

    if (resultSaved) {
      heading = "Your result is saved";

      const score = handoffCompletion?.score;

      const total = handoffCompletion?.total_questions;

      const xp = handoffCompletion?.xp_earned ?? 0;

      if (typeof score === "number" && typeof total === "number") {
        description = `${handoffLessonName} has been saved with a score of ${score}/${total}. You earned ${xp} XP.`;
      } else {
        description = `${handoffLessonName} has been added to your Histopository progress.`;
      }
    }

    if (wantsProgressHandoff && handoffStatus === "none") {
      heading = "Your account is ready";

      description = "You're signed in and ready to continue learning.";
    }

    return (
      <main className="auth-page">
        <section className="auth-card auth-signed-in">
          <Link to="/" className="auth-brand">
            <img src="/histopository-logo.png" alt="" />

            <span>Histopository</span>
          </Link>

          {!resultSaving && <div className="auth-success-icon">✓</div>}

          <h1>{heading}</h1>

          <p>{description}</p>

          {resultFailed && (
            <>
              <p className="auth-message error">{handoffError}</p>

              <button
                type="button"
                className="auth-submit"
                onClick={retryGuestProgressSave}
              >
                Try saving again
              </button>
            </>
          )}

          {!resultSaving && !resultFailed && (
            <div className="auth-signed-actions">
              <Link to="/learn" className="auth-primary-link">
                Continue learning
              </Link>

              <Link to="/profile" className="auth-secondary-link">
                View profile
              </Link>
            </div>
          )}
        </section>
      </main>
    );
  }

  /* =======================================================
     SIGNED OUT
     ======================================================= */

  const isForgot = mode === "forgot";

  const isSignup = mode === "signup";

  /*
    Old browser progress is deliberately invisible during
    a normal login.

    It only becomes eligible when the user arrived via the
    explicit save-result CTA.
  */

  const pendingGuestAttempt = wantsProgressHandoff
    ? getPendingGuestAttempt()
    : null;

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
              : pendingGuestAttempt
                ? "Create an account or log in to save the lesson result you just completed."
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
                  ? pendingGuestAttempt
                    ? "Create account & save result"
                    : "Create account"
                  : pendingGuestAttempt
                    ? "Log in & save result"
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
