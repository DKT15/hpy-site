import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import AppLayout from "./components/AppLayout";

import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LearnPage from "./pages/LearnPage";
import QuizPage from "./pages/QuizPage";
import DailyPage from "./pages/DailyPage";
import ProfilePage from "./pages/ProfilePage";

import { supabase } from "./lib/supabase";

export default function App() {
  useEffect(() => {
    async function syncTimezone() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (!timezone) {
        return;
      }

      const { error } = await supabase.rpc("set_user_timezone", {
        p_timezone: timezone,
      });

      if (error) {
        console.error("Could not update timezone:", error);
      }
    }

    syncTimezone();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route element={<AppLayout />}>
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/lesson/:lessonSlug" element={<QuizPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
