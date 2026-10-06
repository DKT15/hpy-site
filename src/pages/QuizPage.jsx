import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "/styles/QuizPage.css";

function formatSlug(slug = "") {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function QuizPage() {
  const { lessonSlug } = useParams();

  const [lessonName, setLessonName] = useState("");
  const [lessonXp, setLessonXp] = useState(50);
  const [questions, setQuestions] = useState([]);

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
    async function loadQuiz() {
      setLoading(true);
      setError("");

      const [
        { data: quizData, error: quizError },
        { data: lessonData, error: lessonError },
      ] = await Promise.all([
        supabase.rpc("get_lesson_quiz", {
          p_lesson_slug: lessonSlug,
        }),

        supabase
          .from("lessons")
          .select("name, xp_reward")
          .eq("slug", lessonSlug)
          .single(),
      ]);

      if (quizError) {
        console.error(quizError);
        setError("Could not load this lesson.");
        setLoading(false);
        return;
      }

      if (lessonError) {
        console.error(lessonError);
      }

      setQuestions(quizData ?? []);

      setLessonName(lessonData?.name ?? formatSlug(lessonSlug));

      setLessonXp(lessonData?.xp_reward ?? 50);

      setLoading(false);
    }

    loadQuiz();
  }, [lessonSlug]);

  async function checkAnswer() {
    if (!selectedAnswer || checking || result) {
      return;
    }

    const question = questions[currentIndex];

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

  async function finishQuiz() {
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFinished(true);
      setSaving(false);
      return;
    }

    const { data, error } = await supabase.rpc("complete_lesson_quiz", {
      p_lesson_slug: lessonSlug,
      p_answers: responses,
    });

    if (error) {
      console.error(error);
      setError("Your quiz result could not be saved.");
      setSaving(false);
      return;
    }

    const completionResult = Array.isArray(data) ? data[0] : data;

    setCompletion(completionResult);
    setFinished(true);
    setSaving(false);
  }

  async function handleNext() {
    if (currentIndex === questions.length - 1) {
      await finishQuiz();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedAnswer(null);
    setResult(null);
  }

  if (loading) {
    return (
      <main className="quiz-page">
        <p>Loading lesson...</p>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className="quiz-page">
        <div className="quiz-panel">
          <h1>Unable to load lesson</h1>
          <p>{error}</p>

          <Link to="/learn" className="quiz-primary-button">
            Back to learning
          </Link>
        </div>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="quiz-page">
        <div className="quiz-panel">
          <h1>{lessonName}</h1>
          <p>No questions are available yet.</p>

          <Link to="/learn" className="quiz-primary-button">
            Back to learning
          </Link>
        </div>
      </main>
    );
  }

  if (finished) {
    const total = completion?.total_questions ?? questions.length;

    const finalScore = completion?.score ?? score;

    const percentage = Math.round((finalScore / total) * 100);

    return (
      <main className="quiz-page">
        <section className="quiz-results">
          <div className="quiz-result-emblem">★</div>

          <p className="quiz-kicker">LESSON COMPLETE</p>

          <h1>{lessonName}</h1>

          <p className="quiz-results-score">
            {finalScore}/{total}
          </p>

          <p className="quiz-results-percentage">{percentage}% correct</p>

          {completion ? (
            <>
              <div className="quiz-reward-grid">
                <div>
                  <strong>{completion.xp_earned ?? 0}</strong>
                  <span>XP earned</span>
                </div>

                <div>
                  <strong>
                    {completion.best_score ?? finalScore}/{total}
                  </strong>
                  <span>Best score</span>
                </div>
              </div>

              {completion.first_attempt_bonus > 0 && (
                <p className="quiz-bonus-message">
                  Includes a {completion.first_attempt_bonus} XP first-try
                  bonus.
                </p>
              )}

              {completion.xp_earned === 0 && (
                <p className="quiz-saved-message">
                  Progress saved. No additional XP earned this time.
                </p>
              )}
            </>
          ) : (
            <div className="quiz-guest-message">
              <h2>Want to keep your progress?</h2>

              <p>
                Create a free account to save scores, earn XP and build your
                streak.
              </p>

              <Link to="/login" className="quiz-primary-button">
                Create free account
              </Link>
            </div>
          )}

          <div className="quiz-result-actions">
            <Link to="/learn" className="quiz-primary-button">
              Continue learning
            </Link>

            <Link
              to={`/lesson/${lessonSlug}`}
              className="quiz-secondary-button"
              onClick={() => window.location.reload()}
            >
              Play again
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const question = questions[currentIndex];

  const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="quiz-page">
      <section className="quiz-topbar">
        <Link to="/learn" className="quiz-exit">
          ×
        </Link>

        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="quiz-question-count">
          {currentIndex + 1}/{questions.length}
        </span>
      </section>

      <section className="quiz-panel">
        <div className="quiz-heading">
          <p className="quiz-kicker">{lessonName}</p>

          <span>Up to {lessonXp} mastery XP</span>
        </div>

        {question.image_url && (
          <img
            className="quiz-question-image"
            src={question.image_url}
            alt=""
          />
        )}

        <h1 className="quiz-question">{question.prompt}</h1>

        <div className="quiz-options">
          {question.options?.map((option, index) => {
            let className = "quiz-option";

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
                type="button"
                key={option.id}
                className={className}
                disabled={Boolean(result)}
                onClick={() => setSelectedAnswer(option.id)}
              >
                <span className="quiz-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span>{option.answer_text}</span>

                {result && option.id === result.correct_answer_id && (
                  <span className="quiz-option-status">✓</span>
                )}

                {result &&
                  option.id === selectedAnswer &&
                  !result.is_correct && (
                    <span className="quiz-option-status">×</span>
                  )}
              </button>
            );
          })}
        </div>

        {result && (
          <div
            className={
              result.is_correct
                ? "quiz-feedback correct"
                : "quiz-feedback incorrect"
            }
          >
            <h2>{result.is_correct ? "Correct!" : "Not quite"}</h2>

            {result.explanation && <p>{result.explanation}</p>}
          </div>
        )}

        {error && <p className="quiz-error">{error}</p>}

        <div className="quiz-action-row">
          {!result ? (
            <button
              type="button"
              className="quiz-primary-button"
              disabled={!selectedAnswer || checking}
              onClick={checkAnswer}
            >
              {checking ? "Checking..." : "Check answer"}
            </button>
          ) : (
            <button
              type="button"
              className="quiz-primary-button"
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
