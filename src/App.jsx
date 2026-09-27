import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LearnPage from "./pages/LearnPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import QuizPage from "./pages/QuizPage";

function App() {
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/lesson/:lessonSlug" element={<QuizPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
