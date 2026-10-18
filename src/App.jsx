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
import CoursePage from "./pages/CoursePage";

import RequireAdmin from "./admin/RequireAdmin";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import TopicsAdmin from "./admin/TopicsAdmin";
import CoursesAdmin from "./admin/CoursesAdmin";
import LessonsAdmin from "./admin/LessonsAdmin";

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

      const { error: streakError } = await supabase.rpc("refresh_user_streak");

      if (streakError) {
        console.error("Could not refresh streak:", streakError);
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

      {/* LEARNING APP */}

      <Route element={<AppLayout />}>
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/course/:courseSlug" element={<CoursePage />} />
        <Route path="/lesson/:lessonSlug" element={<QuizPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* ADMIN

          React controls the interface only.

          Supabase RLS / Storage policies remain the real
          security boundary.*/}

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="topics" element={<TopicsAdmin />} />
          <Route path="courses" element={<CoursesAdmin />} />
          <Route path="lessons" element={<LessonsAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}
