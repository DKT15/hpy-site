import { useEffect, useRef, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";
import "../../styles/AuthPage.css";

const PENDING_GUEST_ATTEMPT_KEY = "histopository_pending_guest_lesson_attempt";

const PENDING_GUEST_DAILY_KEY = "histopository_pending_guest_daily_attempt";

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

    name: attempt.lesson_name || "Your lesson",
  };
}

/* =========================================================
   PENDING GUEST DAILY CHALLENGE
   ========================================================= */

function getPendingGuestDailyAttempt() {
  try {
    const raw = localStorage.getItem(PENDING_GUEST_DAILY_KEY);

    if (!raw) {
      return null;
    }

    const attempt = JSON.parse(raw);

    const isValid =
      attempt?.version === 1 &&
      typeof attempt.challenge_id === "string" &&
      attempt.challenge_id.length > 0 &&
      typeof attempt.challenge_date === "string" &&
      attempt.challenge_date.length > 0 &&
      Array.isArray(attempt.answers) &&
      attempt.answers.length > 0 &&
      typeof attempt.saved_at === "number";

    if (!isValid) {
      localStorage.removeItem(PENDING_GUEST_DAILY_KEY);

      return null;
    }

    const isExpired = Date.now() - attempt.saved_at > PENDING_ATTEMPT_MAX_AGE;

    if (isExpired) {
      localStorage.removeItem(PENDING_GUEST_DAILY_KEY);

      return null;
    }

    return attempt;
  } catch (storageError) {
    console.error("Could not read guest Daily Challenge:", storageError);

    return null;
  }
}

function clearPendingGuestDailyAttempt() {
  try {
    localStorage.removeItem(PENDING_GUEST_DAILY_KEY);
  } catch (storageError) {
    console.error("Could not clear guest Daily Challenge:", storageError);
  }
}

async function savePendingGuestDailyProgress() {
  const attempt = getPendingGuestDailyAttempt();

  if (!attempt) {
    return {
      status: "none",
      completion: null,
    };
  }

  const { data, error } = await supabase.rpc("complete_daily_challenge", {
    p_challenge_id: attempt.challenge_id,

    p_answers: attempt.answers,
  });

  if (error) {
    console.error("Could not save guest Daily Challenge:", error);

    return {
      status: "error",
      error,
      completion: null,
    };
  }

  const completion = Array.isArray(data) ? data[0] : data;

  clearPendingGuestDailyAttempt();

  return {
    status: "saved",
    completion,

    name: attempt.challenge_title || "Daily History Challenge",
  };
}

/* =========================================================
   HANDOFF ROUTING
   ========================================================= */

async function saveSelectedHandoff(handoffType) {
  if (handoffType === "daily") {
    return savePendingGuestDailyProgress();
  }

  if (handoffType === "lesson") {
    return savePendingGuestProgress();
  }

  return {
    status: "none",
    completion: null,
  };
}

/* =========================================================
   AUTH PAGE
   ========================================================= */

export default function AuthPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const wantsProgressHandoff = searchParams.get("saveProgress") === "1";

  const wantsDailyHandoff = searchParams.get("saveDaily") === "1";

  const wantsAnyHandoff = wantsProgressHandoff || wantsDailyHandoff;

  const handoffType = wantsDailyHandoff
    ? "daily"
    : wantsProgressHandoff
      ? "lesson"
      : null;

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

  const [handoffName, setHandoffName] = useState("");

  /*
    Prevent the same mounted AuthPage instance
    from starting the handoff more than once.
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
     ======================================================= */

  useEffect(() => {
    async function performHandoff() {
      if (!session || !handoffType || handoffStarted.current) {
        return;
      }

      handoffStarted.current = true;

      const pendingAttempt =
        handoffType === "daily"
          ? getPendingGuestDailyAttempt()
          : getPendingGuestAttempt();

      if (!pendingAttempt) {
        setHandoffStatus("none");

        return;
      }

      setHandoffStatus("saving");
      setHandoffError("");

      const result = await saveSelectedHandoff(handoffType);

      if (result.status === "error") {
        setHandoffStatus("error");

        if (handoffType === "daily") {
          setHandoffError(
            "We couldn't confirm that your Daily Challenge result was saved. Your result is still stored on this device, so you can safely try again.",
          );
        } else {
          setHandoffError(
            "You're signed in, but we couldn't save your guest lesson result. Your result is still stored on this device so you can try again.",
          );
        }

        return;
      }

      if (result.status === "saved") {
        setHandoffCompletion(result.completion);

        setHandoffName(result.name);

        setHandoffStatus("saved");

        return;
      }

      setHandoffStatus("none");
    }

    performHandoff();
  }, [session, handoffType]);

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
    if (!handoffType) {
      return;
    }

    setHandoffStatus("saving");
    setHandoffError("");

    const result = await saveSelectedHandoff(handoffType);

    if (result.status === "error") {
      setHandoffStatus("error");

      if (handoffType === "daily") {
        setHandoffError(
          "We still couldn't confirm your Daily Challenge result. Your pending result has been kept on this device.",
        );
      } else {
        setHandoffError(
          "We still couldn't save your lesson result. Your pending result has been kept so you can try again.",
        );
      }

      return;
    }

    if (result.status === "saved") {
      setHandoffCompletion(result.completion);

      setHandoffName(result.name);

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
      let pendingAttempt = null;

      if (handoffType === "daily") {
        pendingAttempt = getPendingGuestDailyAttempt();
      }

      if (handoffType === "lesson") {
        pendingAttempt = getPendingGuestAttempt();
      }

      let confirmationPath = "/login?confirmed=1";

      if (pendingAttempt && handoffType === "lesson") {
        confirmationPath = "/login?confirmed=1&saveProgress=1";
      }

      if (pendingAttempt && handoffType === "daily") {
        confirmationPath = "/login?confirmed=1&saveDaily=1";
      }

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

      if (data.session) {
        setSession(data.session);

        setLoading(false);

        return;
      }

      if (pendingAttempt && handoffType === "daily") {
        setMessage(
          "Account created. Check your email to confirm your account. Your Daily Challenge result will be saved when you return.",
        );
      } else if (pendingAttempt && handoffType === "lesson") {
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

    if (!wantsAnyHandoff) {
      navigate("/learn", {
        replace: true,
      });
    }
  }

  /* =======================================================
     SESSION INITIALISING
     ======================================================= */

  if (sessionLoading) {
    return <AppLoading message="Checking your account..." />;
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

    if (confirmedFromEmail && !wantsAnyHandoff) {
      heading = "Account confirmed";

      description =
        "Your email has been confirmed and your Histopository account is ready to use.";
    }

    if (resultSaving) {
      heading = confirmedFromEmail ? "Account confirmed" : "Saving your result";

      description =
        handoffType === "daily"
          ? "Your account is ready. We're securely saving the Daily Challenge you completed as a guest."
          : "Your account is ready. We're securely saving the lesson you completed as a guest.";
    }

    if (resultSaved) {
      heading = confirmedFromEmail ? "Account confirmed" : "Result saved";

      const score = handoffCompletion?.score;

      const total = handoffCompletion?.total_questions;

      const xp = handoffCompletion?.xp_earned ?? 0;

      const savePhrase = confirmedFromEmail
        ? "has also been saved to your account"
        : "has been saved to your account";

      if (typeof score === "number" && typeof total === "number") {
        description = `${handoffName} ${savePhrase} with a score of ${score}/${total}. You earned ${xp} XP.`;
      } else {
        description = `${handoffName} ${savePhrase}.`;
      }
    }

    if (wantsAnyHandoff && handoffStatus === "none") {
      heading = confirmedFromEmail ? "Account confirmed" : "You're signed in";

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

  const pendingGuestAttempt =
    handoffType === "lesson" ? getPendingGuestAttempt() : null;

  const pendingGuestDailyAttempt =
    handoffType === "daily" ? getPendingGuestDailyAttempt() : null;

  const hasPendingHandoff = Boolean(
    pendingGuestAttempt || pendingGuestDailyAttempt,
  );

  let authDescription = "Continue your learning journey.";

  if (isForgot) {
    authDescription =
      "Enter your email and we’ll send you a password reset link.";
  } else if (pendingGuestDailyAttempt) {
    authDescription =
      "Create an account or log in to save the Daily Challenge result you just completed.";
  } else if (pendingGuestAttempt) {
    authDescription =
      "Create an account or log in to save the lesson result you just completed.";
  } else if (isSignup) {
    authDescription =
      "Save your progress, earn XP and build your history streak.";
  }

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

          <p>{authDescription}</p>
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
                  ? hasPendingHandoff
                    ? "Create account & save result"
                    : "Create account"
                  : hasPendingHandoff
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
