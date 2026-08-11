import {
  BookOpen,
  CircleHelp,
  Landmark,
  Mail,
  Youtube
} from 'lucide-react';

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
      focusable="false"
      aria-hidden="true"
    >
      <path d="M16.6 5.82a4.85 4.85 0 0 0 2.83.9V9.8a7.86 7.86 0 0 1-2.83-.53v5.63a6.1 6.1 0 1 1-5.26-6.04v3.12a3 3 0 1 0 2.16 2.88V2h3.1c.02.28.05.55.1.82a4.9 4.9 0 0 0 1.9 3z" />
    </svg>
  );
}

function LandingPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

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

                <form
                  className="signup-form"
                  action="/api/subscribe"
                  method="POST"
                >
                  <div className="email-field">

                    <Mail
                      className="email-icon"
                      size={20}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <label
                      className="sr-only"
                      htmlFor="newsletter-email"
                    >
                      Email address
                    </label>

                    <input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Enter your email address"
                      required
                    />

                  </div>

                  <button
                    className="signup-button"
                    type="submit"
                  >
                    Join the community
                  </button>
                </form>

                <p className="privacy-line">
                  No spam. Unsubscribe anytime.{' '}
                  <a href="/privacy">
                    Privacy policy
                  </a>.
                </p>
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

                <span className="brand-name">
                  HISTOPOSITORY
                </span>
              </a>

              <p>
                History made engaging.
              </p>

            </div>

            <div className="footer-right">

              <nav
                className="social-links"
                aria-label="Histopository social media"
              >

                {/* REPLACE WITH YOUR TIKTOK URL */}

                <a
                  href="REPLACE_WITH_TIKTOK_URL"
                  className="social-link"
                  aria-label="Histopository on TikTok"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TikTokIcon />
                </a>

                {/* REPLACE WITH YOUR YOUTUBE URL */}

                <a
                  href="REPLACE_WITH_YOUTUBE_URL"
                  className="social-link"
                  aria-label="Histopository on YouTube"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube
                    size={22}
                    aria-hidden="true"
                  />
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

export default LandingPage;