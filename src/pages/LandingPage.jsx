import "/styles/LandingPage.css";
import {
  BookOpen,
  CircleHelp,
  Landmark,
} from 'lucide-react';

import {
  siTiktok,
  siYoutube
} from 'simple-icons';

import NewsletterSignup from '../components/NewsletterSignup';


const benefits = [
  {
    title: 'Fascinating Stories',
    description: 'Discover incredible stories and moments from across history.',
    icon: BookOpen
  },
  {
    title: 'Fun Quizzes',
    description: 'Test your knowledge with engaging history quizzes.',
    icon: CircleHelp
  },
  {
    title: 'History Resources',
    description: 'Explore useful resources designed to help you discover more.',
    icon: Landmark
  }
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
    <>
      <div className="site">
        <header className="site-header">
          <div className="container header-inner">
            <a
              className="brand"
              href="/"
              aria-label="Histopository home"
            >
              <img
                src="/histopository-logo.png"
                alt=""
                className="brand-logo"
              />

              <span className="brand-name">
                HISTOPOSITORY
              </span>
            </a>
          </div>
        </header>

        <main id="main-content">

          {/* HERO */}

          <section
            className="hero"
            aria-labelledby="hero-heading"
          >
            <div className="container hero-grid">

              <div className="hero-content">
                <p className="eyebrow">
                  Explore the past
                </p>

                <h1 id="hero-heading">
                  History made{' '}
                  <span className="accent-text">
                    engaging.
                  </span>
                </h1>

                <p className="hero-tagline">
                  Learn something new every day.
                </p>

                <p className="hero-description">
                  Discover fascinating stories, test your
                  knowledge and explore history through
                  engaging content delivered straight to
                  your inbox.
                </p>

                {/* NEWSLETTER FORM */}

                <NewsletterSignup />

              </div>

              {/* HERO ART */}

              <div
                className="hero-art"
                aria-hidden="true"
              >
                <img
                  src="/hero-art.webp"
                  alt=""
                  className="hero-art-image"
                />
              </div>

            </div>
          </section>

          {/* WHAT YOU'LL GET */}

          <section
            className="benefits-section"
            aria-labelledby="benefits-heading"
          >
            <div className="container">

              <div className="section-heading">
                <p className="eyebrow">
                  What you will get
                </p>

                <h2 id="benefits-heading">
                  A better way to explore history
                </h2>
              </div>

              <div className="benefits-grid">

                {benefits.map(
                  ({
                    title,
                    description,
                    icon: Icon
                  }) => (
                    <article
                      className="benefit-card"
                      key={title}
                    >
                      <div
                        className="benefit-icon"
                        aria-hidden="true"
                      >
                        <Icon
                          size={34}
                          strokeWidth={1.7}
                        />
                      </div>

                      <h3>{title}</h3>

                      <p>
                        {description}
                      </p>
                    </article>
                  )
                )}

              </div>
            </div>
          </section>

        </main>

        {/* FOOTER */}

        <footer className="site-footer">
          <div className="container footer-inner">

            <div className="footer-brand">

              <a
                className="brand footer-logo"
                href="/"
                aria-label="Histopository home"
              >
                <img
                  src="/histopository-logo.png"
                  alt=""
                  className="brand-logo"
                />
              </a>

            </div>

            <div className="footer-right">

              <nav
                className="social-links"
                aria-label="Histopository social media"
              >

                <a
            href="REPLACE_WITH_TIKTOK_URL"
              className="social-link"
              aria-label="Histopository on TikTok"
              target="_blank"
              rel="noopener noreferrer"
            >
              <TikTokIcon />
            </a>

            <a
              href="REPLACE_WITH_YOUTUBE_URL"
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
    </>
  );
}

