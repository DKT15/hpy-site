import { useEffect, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

import "../../styles/Admin.css";

export default function RequireAdmin() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin(session) {
      if (!mounted) {
        return;
      }

      if (!session) {
        setStatus("signed-out");
        return;
      }

      setStatus("checking");

      const { data, error } = await supabase.rpc("is_admin");

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Could not verify admin access:", error);
        setStatus("error");
        return;
      }

      setStatus(data === true ? "allowed" : "denied");
    }

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error("Could not load admin session:", error);
        setStatus("error");
        return;
      }

      await verifyAdmin(session);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyAdmin(session);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return <AppLoading message="Checking admin access..." />;
  }

  if (status === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  if (status === "denied") {
    return (
      <main className="admin-access-page">
        <section className="admin-access-card">
          <img
            src="/histopository-logo.png"
            alt=""
            className="admin-access-logo"
          />

          <p className="admin-kicker">HISTOPOSITORY ADMIN</p>

          <h1>Admin access required</h1>

          <p>
            This account does not have permission to manage Histopository
            content.
          </p>

          <Link to="/learn" className="admin-primary-button">
            Return to Histopository
          </Link>
        </section>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="admin-access-page">
        <section className="admin-access-card">
          <img
            src="/histopository-logo.png"
            alt=""
            className="admin-access-logo"
          />

          <p className="admin-kicker">HISTOPOSITORY ADMIN</p>

          <h1>Could not verify access</h1>

          <p>We could not confirm your admin permissions. Please try again.</p>

          <Link to="/learn" className="admin-primary-button">
            Return to Histopository
          </Link>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
