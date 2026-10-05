import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "/styles/AppLayout.css";

export default function AppLayout() {
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
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">
          <img src="/histopository-logo.png" alt="" className="app-logo" />

          <span>Histopository</span>
        </Link>

        <nav className="app-nav" aria-label="Main navigation">
          <NavLink
            to="/learn"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            Learn
          </NavLink>

          <NavLink
            to="/daily"
            className={({ isActive }) =>
              isActive ? "app-nav-link active" : "app-nav-link"
            }
          >
            Daily
          </NavLink>

          {session ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "app-nav-link active" : "app-nav-link"
              }
            >
              Profile
            </NavLink>
          ) : (
            <Link to="/login" className="app-login-link">
              Log in
            </Link>
          )}
        </nav>
      </header>

      <div className="app-content">
        <Outlet />
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink
          to="/learn"
          className={({ isActive }) =>
            isActive ? "mobile-nav-link active" : "mobile-nav-link"
          }
        >
          <span>Learn</span>
        </NavLink>

        <NavLink
          to="/daily"
          className={({ isActive }) =>
            isActive ? "mobile-nav-link active" : "mobile-nav-link"
          }
        >
          <span>Daily</span>
        </NavLink>

        {session ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            <span>Profile</span>
          </NavLink>
        ) : (
          <Link to="/login" className="mobile-nav-link">
            <span>Log in</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
