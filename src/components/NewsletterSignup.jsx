import { useId, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import '/styles/NewsletterSignup.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  const email = value.trim();

  if (!email) {
    return 'Enter your email address.';
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.';
  }

  return '';
}

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const emailInputRef = useRef(null);

  const uid = useId().replaceAll(':', '');

  const emailId = `newsletter-email-${uid}`;
  const helpId = `newsletter-help-${uid}`;
  const errorId = `newsletter-error-${uid}`;
  const statusId = `newsletter-status-${uid}`;
  const companyId = `company-${uid}`;

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const validationMessage = validateEmail(normalizedEmail);

    if (validationMessage) {
      setFieldError(validationMessage);
      setStatus('idle');
      setMessage('');

      emailInputRef.current?.focus();

      return;
    }

    setFieldError('');
    setStatus('loading');
    setMessage('');

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 12000);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },

        signal: controller.signal,

        body: JSON.stringify({
          email: normalizedEmail,

          /*
           * Honeypot field.
           * Real users should never fill this in.
           */
          company:
            event.currentTarget.elements.company?.value || ''
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            'We could not process your signup right now.'
        );
      }

      setEmail('');
      setStatus('success');
      setMessage('Thanks. Your signup has been received.');
    } catch (error) {
      const isTimeout = error?.name === 'AbortError';

      setStatus('error');

      setMessage(
        isTimeout
          ? 'The signup took too long. Please try again.'
          : error?.message ||
              'Unable to subscribe right now. Please try again.'
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (fieldError) {
      setFieldError('');
    }

    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  }

  const describedBy = [
    helpId,
    fieldError ? errorId : '',
    message ? statusId : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="newsletter">
      <form
        className="signup-form"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={status === 'loading'}
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
            htmlFor={emailId}
          >
            Email address
          </label>

          <input
            ref={emailInputRef}
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            aria-describedby={describedBy}
            aria-invalid={fieldError ? 'true' : 'false'}
            aria-errormessage={
              fieldError ? errorId : undefined
            }
            disabled={status === 'loading'}
            required
          />
        </div>

        <button
          className="signup-button"
          type="submit"
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? 'Joining…'
            : 'Join Histopository'}
        </button>

        <div
          className="honeypot-field"
          aria-hidden="true"
        >
          <label htmlFor={companyId}>
            Company
          </label>

          <input
            id={companyId}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </form>

      <p
        className="no-spam-line"
        id={helpId}
      >
        <span aria-hidden="true">◆</span>{' '}
        No spam. Unsubscribe anytime.
      </p>

      {fieldError && (
        <p
          id={errorId}
          className="field-error"
          role="alert"
        >
          {fieldError}
        </p>
      )}

      {message && (
        <p
          id={statusId}
          className={`form-message ${status}`}
          role={status === 'error' ? 'alert' : 'status'}
          aria-live={
            status === 'error'
              ? 'assertive'
              : 'polite'
          }
        >
          {message}
        </p>
      )}

      <p className="privacy-line">
        By joining, you agree to receive Histopository
        emails.{' '}
        <a href="/privacy">
          Privacy policy
        </a>
        .
      </p>
    </div>
  );
}
