import "../../styles/LandingPage.css";

import { BookOpen, CalendarDays, Flame } from "lucide-react";

import { siTiktok, siYoutube } from "simple-icons";
import { Link } from "react-router-dom";

import NewsletterSignup from "../components/NewsletterSignup";
import LandingHeader from "../components/LandingHeader";

const benefits = [
  {
    title: "Interactive Lessons",
    description:
      "Learn through short history lessons and quizzes designed to make knowledge stick.",
    icon: BookOpen,
  },
  {
    title: "Daily Challenge",
    description:
      "Take on five new history questions each day and see how much you know.",
    icon: CalendarDays,
  },
  {
    title: "Build Your Streak",
    description:
      "Create a free account to earn XP, track your progress and build a learning streak.",
    icon: Flame,
  },
];

function TikTokIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={siTiktok.path} />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={siYoutube.path} />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="site">
      <LandingHeader />

      <main id="main-content">
        {/* HERO */}

        <section className="home-hero" aria-labelledby="hero-heading">
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              <h1 id="hero-heading">
                Learn history.
                <br />
                One challenge at a time.
              </h1>

              <p className="home-hero-description">
                Explore the past through short, interactive lessons, quizzes and
                daily challenges. Learn at your own pace, test what you know and
                build your history streak.
              </p>

              <div className="home-hero-actions">
                <Link to="/learn" className="home-primary-button">
                  Start learning
                </Link>

                <Link to="/daily" className="home-secondary-button">
                  Try today&apos;s challenge
                </Link>
              </div>

              <p className="home-account-note">
                No account required to start. Create a free account to save
                progress, earn XP and build your streak.
              </p>
            </div>

            <div className="home-hero-visual">
              <img
                src="/images/home/main-image.webp"
                alt="Historical artwork representing the study of history"
              />

              <div className="home-hero-card home-hero-card-xp">
                <strong>+25 XP</strong>
                <span>Daily Challenge</span>
              </div>

              <div className="home-hero-card home-hero-card-streak">
                <strong>🔥 7</strong>
                <span>Day streak</span>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}

        <section
          className="benefits-section"
          aria-labelledby="benefits-heading"
        >
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">LEARN. TEST. DISCOVER.</p>

              <h2 id="benefits-heading">A better way to explore history</h2>

              <p className="section-description">
                Histopository turns history into short, rewarding learning
                sessions you can return to every day.
              </p>
            </div>

            <div className="benefits-grid">
              {benefits.map(({ title, description, icon: Icon }) => (
                <article className="benefit-card" key={title}>
                  <div className="benefit-icon" aria-hidden="true">
                    <Icon size={34} strokeWidth={1.7} />
                  </div>

                  <h3>{title}</h3>

                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* START LEARNING CTA */}

        <section className="home-learning-cta">
          <div className="container">
            <div className="home-learning-cta-inner">
              <div>
                <p className="eyebrow">START EXPLORING</p>

                <h2>How much history do you really know?</h2>

                <p>
                  Jump straight into your first lesson. No account is required
                  to play.
                </p>
              </div>

              <Link to="/learn" className="home-primary-button">
                Explore lessons
              </Link>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}

        <section
          className="home-newsletter-section"
          aria-labelledby="newsletter-heading"
        >
          <div className="container">
            <div className="home-newsletter-inner">
              <div className="home-newsletter-copy">
                <p className="eyebrow">MORE FROM HISTOPOSITORY</p>

                <h2 id="newsletter-heading">
                  History worth opening your inbox for.
                </h2>

                <p>
                  Get interesting stories, discoveries and Histopository updates
                  delivered to your inbox.
                </p>
              </div>

              <div className="home-newsletter-form">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <Link
              className="brand footer-logo"
              to="/"
              aria-label="Histopository home"
            >
              <img
                src="/histopository-logo.png"
                alt="Histopository logo"
                className="brand-logo"
              />
            </Link>
          </div>

          <div className="footer-right">
            <nav
              className="social-links"
              aria-label="Histopository social media"
            >
              <a
                href="https://www.tiktok.com/@histopository"
                className="social-link"
                aria-label="Histopository on TikTok"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TikTokIcon />
              </a>

              <a
                href="https://www.youtube.com/@histopository"
                className="social-link"
                aria-label="Histopository on YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <YouTubeIcon />
              </a>
            </nav>

            <p className="copyright">
              ® {new Date().getFullYear()} Histopository
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
