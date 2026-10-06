import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../../styles/LandingHeader.css";

export default function LandingHeader() {
  const [session, setSession] = useState(null);

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

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        <Link to="/" className="landing-brand">
          <img
            src="/histopository-logo.png"
            alt=""
            className="landing-header-logo"
          />

          <span>Histopository</span>
        </Link>

        <nav className="landing-nav" aria-label="Homepage navigation">
          <Link to="/learn">Learn</Link>

          <Link to="/daily">Daily Challenge</Link>

          {session ? (
            <Link to="/profile" className="landing-account-link">
              Profile
            </Link>
          ) : (
            <Link to="/login" className="landing-account-link">
              Log in
            </Link>
          )}
        </nav>

        <Link to="/learn" className="landing-start-button">
          Start learning
        </Link>
      </div>
    </header>
  );
}
