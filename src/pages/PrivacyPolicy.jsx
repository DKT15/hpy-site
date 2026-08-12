import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import "/styles/PrivacyPolicy.css";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <Link to="/" className="privacy-back-link">
            <ArrowLeft size={18} aria-hidden="true" />
            Back Home
          </Link>
          <div className="privacy-brand">
            <img
              src="/histopository-logo.png"
              alt=""
              className="privacy-logo"
            />

            <span>HISTOPOSITORY</span>
          </div>
        </header>

        <article className="privacy-content">
          <div className="privacy-intro">
            <div className="privacy-icon" aria-hidden="true">
              <ShieldCheck size={32} strokeWidth={1.6} />
            </div>

            <p className="privacy-eyebrow">Your privacy</p>

            <h1>Privacy Policy</h1>

            <p className="privacy-summary">
              Histopository respects your privacy and aims to be clear about
              what information we collect, why we collect it and how it is used.
            </p>

            <p className="privacy-updated">Last updated: 12 August 2026</p>
          </div>

          <div className="privacy-sections">
            <section>
              <h2>1. Who we are</h2>

              <p>
                Histopository is a history content platform providing
                educational and engaging history content, quizzes, resources and
                newsletters.
              </p>

              <p>
                For questions about this Privacy Policy or how your personal
                information is handled, you can contact us at:
              </p>

              <a
                className="privacy-email"
                href="mailto:histopository@gmail.com"
              >
                <Mail size={18} aria-hidden="true" />
                histopository@gmail.com
              </a>
            </section>

            <section>
              <h2>2. Information we collect</h2>

              <p>
                When you join the Histopository newsletter, we collect the email
                address that you provide.
              </p>

              <p>
                We may also receive limited technical information needed to
                operate, secure and maintain the website and newsletter service.
              </p>
            </section>

            <section>
              <h2>3. Why we use your information</h2>

              <p>
                We use your email address to send you Histopository newsletters
                and related history content that you have chosen to receive.
              </p>

              <p>
                We may also use limited technical information to protect the
                website from spam, abuse and security threats.
              </p>
            </section>

            <section>
              <h2>4. Our lawful basis</h2>

              <p>
                Where we send you marketing or newsletter emails, we rely on
                your consent.
              </p>

              <p>
                You can withdraw that consent at any time by using the
                unsubscribe link included in our emails.
              </p>
            </section>

            <section>
              <h2>5. MailerLite</h2>

              <p>
                Histopository uses MailerLite to manage email subscribers and
                send newsletters.
              </p>

              <p>
                When you subscribe, your email address may be transferred to and
                processed by MailerLite for these purposes.
              </p>
            </section>

            <section>
              <h2>6. Website hosting</h2>

              <p>
                Histopository is hosted using Netlify. Information may be
                processed through Netlify infrastructure when you interact with
                the website, including when a newsletter request is submitted.
              </p>
            </section>

            <section>
              <h2>7. How long we keep your information</h2>

              <p>
                We keep your subscriber information while you remain subscribed
                to Histopository or where we otherwise need to retain limited
                information for legitimate legal, security or compliance
                purposes.
              </p>

              <p>
                If you unsubscribe, we will stop sending you newsletter emails.
              </p>
            </section>

            <section>
              <h2>8. Sharing your information</h2>

              <p>We do not sell your personal information.</p>

              <p>
                We only share information with service providers where this is
                necessary to operate Histopository, such as our email service
                and website infrastructure providers.
              </p>
            </section>

            <section>
              <h2>9. International data transfers</h2>

              <p>
                Some of the service providers used by Histopository may process
                information outside the United Kingdom.
              </p>

              <p>
                Where this happens, we aim to use providers that maintain
                appropriate safeguards for personal data.
              </p>
            </section>

            <section>
              <h2>10. Your rights</h2>

              <p>
                Depending on the data protection laws that apply to you, you may
                have rights relating to your personal information, including the
                right to:
              </p>

              <ul>
                <li>Ask for access to your personal data.</li>
                <li>Ask us to correct inaccurate information.</li>
                <li>Ask us to delete your information.</li>
                <li>Ask us to restrict certain processing.</li>
                <li>Object to certain uses of your information.</li>
                <li>Withdraw your consent.</li>
              </ul>

              <p>
                To exercise a privacy right, contact us using the email address
                above.
              </p>
            </section>

            <section>
              <h2>11. Unsubscribing</h2>

              <p>
                Every Histopository marketing email will include an unsubscribe
                option.
              </p>

              <p>
                You can use that link at any time if you no longer want to
                receive our emails.
              </p>
            </section>

            <section>
              <h2>12. Cookies and analytics</h2>

              <p>
                If Histopository introduces analytics, advertising cookies or
                other non-essential tracking technologies in the future, this
                policy will be updated to explain how those technologies are
                used.
              </p>
            </section>

            <section>
              <h2>13. Changes to this policy</h2>

              <p>
                We may update this Privacy Policy as Histopository develops or
                as our services and legal obligations change.
              </p>

              <p>The latest version will always be available on this page.</p>
            </section>

            <section>
              <h2>14. Complaints</h2>

              <p>
                If you have concerns about how we use your personal information,
                please contact us first so that we can try to resolve the issue.
              </p>

              <p>
                You may also have the right to complain to the relevant data
                protection authority.
              </p>
            </section>
          </div>
        </article>

        <footer className="privacy-footer">
          <img src="/histopository-logo.png" alt="" />

          <p>© {new Date().getFullYear()} Histopository</p>
        </footer>
      </div>
    </main>
  );
}
