import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DailyPage() {
  const [challenge, setChallenge] = useState(null);
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
      const { data, error } = await supabase.rpc("get_daily_challenge", {
        p_challenge_date: getLocalDate(),
      });

      if (error) {
        console.error(error);
        setError("Could not load today’s challenge.");
      } else {
        setChallenge(data);
      }

      setLoading(false);
    }

    loadChallenge();
  }, []);

  async function handleAnswer(answerId) {
    if (result || checking) {
      return;
    }

    setSelectedAnswer(answerId);
    setChecking(true);
    setError("");

    const question = challenge.questions[currentIndex];

    const { data, error } = await supabase.rpc("check_answer", {
      p_question_id: question.id,
      p_answer_id: answerId,
    });

    if (error) {
      console.error(error);
      setError("Could not check your answer.");
      setSelectedAnswer(null);
    } else {
      setResult(data);

      setResponses((current) => [
        ...current,
        {
          question_id: question.id,
          answer_id: answerId,
        },
      ]);

      if (data.is_correct) {
        setScore((current) => current + 1);
      }
    }

    setChecking(false);
  }

  async function handleNext() {
    if (currentIndex < challenge.questions.length - 1) {
      setSelectedAnswer(null);
      setResult(null);
      setCurrentIndex((current) => current + 1);
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setFinished(true);
      setSaving(false);
      return;
    }

    const { data, error } = await supabase.rpc("complete_daily_challenge", {
      p_challenge_id: challenge.id,
      p_answers: responses,
    });

    if (error) {
      console.error(error);
      setError("Could not save your Daily Challenge.");
      setSaving(false);
      return;
    }

    setCompletion(data);
    setFinished(true);
    setSaving(false);
  }

  if (loading) {
    return <p>Loading today&apos;s challenge...</p>;
  }

  if (error && !challenge) {
    return <p>{error}</p>;
  }

  if (!challenge) {
    return (
      <main>
        <h1>Daily History Challenge</h1>

        <p>There isn&apos;t a challenge available today.</p>

        <Link to="/learn">Explore lessons</Link>
      </main>
    );
  }

  if (challenge.attempt && !finished) {
    return (
      <main>
        <h1>Daily Challenge complete</h1>

        <p>
          You scored {challenge.attempt.score} out of{" "}
          {challenge.attempt.total_questions}.
        </p>

        <p>{challenge.attempt.xp_earned} XP earned</p>

        <p>Come back tomorrow for a new challenge.</p>

        <Link to="/learn">Continue learning</Link>
      </main>
    );
  }

  if (finished) {
    const finalScore = completion?.score ?? score;

    return (
      <main>
        <h1>Daily Challenge complete</h1>

        <p>
          You scored {finalScore} out of {challenge.questions.length}.
        </p>

        {completion ? (
          <>
            <p>{completion.xp_earned} XP earned</p>

            <p>Come back tomorrow for a new Daily Challenge.</p>
          </>
        ) : (
          <>
            <p>
              Create a free account to save your score, earn XP and build your
              streak.
            </p>

            <Link to="/login">Create account or log in</Link>
          </>
        )}

        <p>
          <Link to="/learn">Continue learning</Link>
        </p>
      </main>
    );
  }

  const question = challenge.questions[currentIndex];

  return (
    <main>
      <p>Daily History Challenge</p>

      <p>Up to {challenge.xp_reward} XP</p>

      <p>
        Question {currentIndex + 1} of {challenge.questions.length}
      </p>

      <progress value={currentIndex + 1} max={challenge.questions.length} />

      <h1>{question.prompt}</h1>

      <div>
        {question.options.map((answer) => {
          let label = answer.answer_text;

          if (result) {
            if (answer.id === result.correct_answer_id) {
              label += " ✓";
            } else if (answer.id === selectedAnswer && !result.is_correct) {
              label += " ✕";
            }
          }

          return (
            <button
              key={answer.id}
              type="button"
              disabled={Boolean(result) || checking}
              onClick={() => handleAnswer(answer.id)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && <p>{error}</p>}

      {result && (
        <section>
          <h2>{result.is_correct ? "Correct!" : "Not quite"}</h2>

          <p>{result.explanation}</p>

          <button type="button" onClick={handleNext} disabled={saving}>
            {saving
              ? "Saving..."
              : currentIndex === challenge.questions.length - 1
                ? "See results"
                : "Next question"}
          </button>
        </section>
      )}
    </main>
  );
}
