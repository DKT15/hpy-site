import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LearnPage from "./pages/LearnPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
