import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        setMessage("Account created and signed in.");
      } else {
        setMessage("Check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      }
    }

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (session) {
    return (
      <main>
        <h1>Account</h1>
        <p>Signed in as {session.user.email}</p>

        <p>
          <Link to="/learn">Go to Learn</Link>
        </p>

        <button type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{mode === "signup" ? "Create account" : "Log in"}</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <div>
            <input
              id="password"
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

        {mode === "login" && (
          <button
            type="button"
            onClick={async () => {
              if (!email) {
                setMessage("Enter your email address first.");
                return;
              }

              setLoading(true);
              setMessage("");

              const { error } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                  redirectTo: `${window.location.origin}/reset-password`,
                },
              );

              if (error) {
                setMessage(error.message);
              } else {
                setMessage(
                  "If an account exists for that email, a password reset link has been sent.",
                );
              }

              setLoading(false);
            }}
          >
            Forgot password?
          </button>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "login" : "signup");
          setMessage("");
        }}
      >
        {mode === "signup"
          ? "Already have an account? Log in"
          : "Need an account? Sign up"}
      </button>
    </main>
  );
}
