import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import "/styles/AppLayout.css";

export default function AppLayout() {
  const [session, setSession] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  /* =======================================================
     SESSION + ADMIN STATUS
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function checkAdmin(currentSession) {
      if (!mounted) {
        return;
      }

      if (!currentSession) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Could not check admin access:", error);

        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
    }

    async function loadSession() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Could not load session:", error);

        setSession(null);
        setIsAdmin(false);

        return;
      }

      setSession(currentSession ?? null);

      await checkAdmin(currentSession ?? null);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) {
        return;
      }

      setSession(currentSession ?? null);

      checkAdmin(currentSession ?? null);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     LOGOUT
     ======================================================= */

  async function handleLogout() {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      console.error("Could not log out:", error);

      return;
    }

    setSession(null);
    setIsAdmin(false);

    navigate("/learn");
  }

  /* =======================================================
     LAYOUT
     ======================================================= */

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">
          <img src="/histopository-logo.png" alt="" className="app-logo" />

          <span>Histopository</span>
        </Link>

        {/* ================================================
            DESKTOP NAVIGATION
            ================================================ */}

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
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "app-nav-link active" : "app-nav-link"
                }
              >
                Profile
              </NavLink>

              {isAdmin && (
                <Link to="/admin" className="app-nav-link">
                  Admin
                </Link>
              )}

              <button
                type="button"
                className="app-logout-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
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

      {/* ================================================
          MOBILE NAVIGATION
          ================================================ */}

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
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "mobile-nav-link active" : "mobile-nav-link"
              }
            >
              <span>Profile</span>
            </NavLink>

            {isAdmin && (
              <Link to="/admin" className="mobile-nav-link">
                <span>Admin</span>
              </Link>
            )}
          </>
        ) : (
          <Link to="/login" className="mobile-nav-link">
            <span>Log in</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
