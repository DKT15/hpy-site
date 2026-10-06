import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "/styles/DailyPage.css";
import AppLoading from "../components/AppLoading";

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DailyPage() {
  const [challenge, setChallenge] = useState(null);
  const [user, setUser] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [responses, setResponses] = useState([]);
  const [score, setScore] = useState(0);

  const [completion, setCompletion] = useState(null);
  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallenge() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);

      const today = getLocalDateString();

      const { data, error } = await supabase.rpc("get_daily_challenge", {
        p_challenge_date: today,
      });

      if (error) {
        console.error(error);
        setError("Could not load today’s challenge.");
        setLoading(false);
        return;
      }

      const loadedChallenge = Array.isArray(data) ? data[0] : data;

      setChallenge(loadedChallenge ?? null);

      if (loadedChallenge?.attempt) {
        setCompletion({
          already_completed: true,
          score: loadedChallenge.attempt.score,
          total_questions: loadedChallenge.attempt.total_questions,
          xp_earned: loadedChallenge.attempt.xp_earned,
        });

        setFinished(true);
      }

      setLoading(false);
    }

    loadChallenge();
  }, []);

  async function checkAnswer() {
    if (!selectedAnswer || checking || result) {
      return;
    }

    const question = challenge.questions[currentIndex];

    setChecking(true);
    setError("");

    const { data, error } = await supabase.rpc("check_answer", {
      p_question_id: question.id,
      p_answer_id: selectedAnswer,
    });

    if (error) {
      console.error(error);
      setError("Could not check your answer.");
      setChecking(false);
      return;
    }

    const answerResult = Array.isArray(data) ? data[0] : data;

    setResult(answerResult);

    setResponses((current) => [
      ...current,
      {
        question_id: question.id,
        answer_id: selectedAnswer,
      },
    ]);

    if (answerResult?.is_correct) {
      setScore((current) => current + 1);
    }

    setChecking(false);
  }

  async function finishChallenge() {
    if (!user) {
      setFinished(true);
      return;
    }

    setSaving(true);
    setError("");

    const { data, error } = await supabase.rpc("complete_daily_challenge", {
      p_challenge_id: challenge.id,
      p_answers: responses,
    });

    if (error) {
      console.error(error);
      setError("Your Daily Challenge could not be saved.");
      setSaving(false);
      return;
    }

    const completionResult = Array.isArray(data) ? data[0] : data;

    setCompletion(completionResult);
    setFinished(true);
    setSaving(false);
  }

  async function handleNext() {
    if (currentIndex === challenge.questions.length - 1) {
      await finishChallenge();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedAnswer(null);
    setResult(null);
  }

  if (loading) {
    return <AppLoading message="Finding today’s challenge..." />;
  }

  if (error && !challenge) {
    return (
      <main className="daily-page">
        <section className="daily-panel">
          <h1>Daily History Challenge</h1>
          <p>{error}</p>

          <Link to="/learn" className="daily-primary-button">
            Back to learning
          </Link>
        </section>
      </main>
    );
  }

  if (!challenge) {
    return (
      <main className="daily-page">
        <section className="daily-panel daily-empty">
          <div className="daily-icon">◆</div>

          <p className="daily-kicker">DAILY HISTORY</p>

          <h1>No challenge today</h1>

          <p>
            There isn&apos;t a Daily Challenge available right now. Check back
            again soon.
          </p>

          <Link to="/learn" className="daily-primary-button">
            Continue learning
          </Link>
        </section>
      </main>
    );
  }

  const questions = challenge.questions ?? [];

  if (finished) {
    const total = completion?.total_questions ?? questions.length;

    const finalScore = completion?.score ?? score;

    const percentage = total > 0 ? Math.round((finalScore / total) * 100) : 0;

    const locked = Boolean(user && completion);

    return (
      <main className="daily-page">
        <section className="daily-results">
          {locked ? (
            <div className="daily-lock-icon">🔒</div>
          ) : (
            <div className="daily-result-icon">◆</div>
          )}

          <p className="daily-kicker">
            {locked ? "TODAY’S CHALLENGE COMPLETE" : "CHALLENGE COMPLETE"}
          </p>

          <h1>{challenge.title ?? "Daily History Challenge"}</h1>

          <p className="daily-results-score">
            {finalScore}/{total}
          </p>

          <p className="daily-results-percentage">{percentage}% correct</p>

          {completion && (
            <div className="daily-reward-card">
              <strong>{completion.xp_earned ?? 0}</strong>

              <span>XP earned today</span>
            </div>
          )}

          {locked ? (
            <div className="daily-locked-message">
              <h2>Challenge locked</h2>

              <p>
                You&apos;ve completed today&apos;s Daily Challenge. A new
                challenge will be available tomorrow.
              </p>
            </div>
          ) : (
            <div className="daily-guest-message">
              <h2>Want to save your result?</h2>

              <p>
                Create a free account to earn XP, save Daily Challenge results
                and build your streak.
              </p>

              <Link to="/login" className="daily-primary-button">
                Create free account
              </Link>
            </div>
          )}

          <div className="daily-result-actions">
            <Link to="/learn" className="daily-primary-button">
              Continue learning
            </Link>

            {user && (
              <Link to="/profile" className="daily-secondary-button">
                View profile
              </Link>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="daily-page">
        <section className="daily-panel">
          <h1>{challenge.title ?? "Daily History Challenge"}</h1>

          <p>No questions are available for today&apos;s challenge.</p>
        </section>
      </main>
    );
  }

  const question = questions[currentIndex];

  const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="daily-page">
      <section className="daily-header-card">
        <div>
          <p className="daily-kicker">DAILY HISTORY</p>

          <h1>{challenge.title ?? "Daily History Challenge"}</h1>

          <p>One attempt per day · Up to {challenge.xp_reward ?? 25} XP</p>
        </div>

        <div className="daily-badge">◆</div>
      </section>

      <section className="daily-topbar">
        <Link to="/learn" className="daily-exit">
          ×
        </Link>

        <div className="daily-progress-track">
          <div
            className="daily-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="daily-question-count">
          {currentIndex + 1}/{questions.length}
        </span>
      </section>

      <section className="daily-panel">
        {question.image_url && (
          <img
            src={question.image_url}
            alt=""
            className="daily-question-image"
          />
        )}

        <h2 className="daily-question">{question.prompt}</h2>

        <div className="daily-options">
          {question.options?.map((option, index) => {
            let className = "daily-option";

            if (selectedAnswer === option.id) {
              className += " selected";
            }

            if (result) {
              if (option.id === result.correct_answer_id) {
                className += " correct";
              } else if (option.id === selectedAnswer) {
                className += " incorrect";
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                className={className}
                disabled={Boolean(result)}
                onClick={() => setSelectedAnswer(option.id)}
              >
                <span className="daily-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span>{option.answer_text}</span>

                {result && option.id === result.correct_answer_id && (
                  <span className="daily-option-status">✓</span>
                )}

                {result &&
                  option.id === selectedAnswer &&
                  !result.is_correct && (
                    <span className="daily-option-status">×</span>
                  )}
              </button>
            );
          })}
        </div>

        {result && (
          <div
            className={
              result.is_correct
                ? "daily-feedback correct"
                : "daily-feedback incorrect"
            }
          >
            <h3>{result.is_correct ? "Correct!" : "Not quite"}</h3>

            {result.explanation && <p>{result.explanation}</p>}
          </div>
        )}

        {error && <p className="daily-error">{error}</p>}

        <div className="daily-action-row">
          {!result ? (
            <button
              type="button"
              className="daily-primary-button"
              disabled={!selectedAnswer || checking}
              onClick={checkAnswer}
            >
              {checking ? "Checking..." : "Check answer"}
            </button>
          ) : (
            <button
              type="button"
              className="daily-primary-button"
              disabled={saving}
              onClick={handleNext}
            >
              {saving
                ? "Saving..."
                : currentIndex === questions.length - 1
                  ? "See results"
                  : "Next question"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
