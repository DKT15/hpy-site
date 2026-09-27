import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function QuizPage() {
  const { lessonSlug } = useParams();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);

  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      const { data, error } = await supabase.rpc("get_lesson_quiz", {
        p_lesson_slug: lessonSlug,
      });

      if (error) {
        console.error(error);
        setError("Could not load this lesson.");
      } else {
        setQuestions(data ?? []);
      }

      setLoading(false);
    }

    loadQuiz();
  }, [lessonSlug]);

  async function handleAnswer(answerId) {
    if (result || checking) {
      return;
    }

    setSelectedAnswer(answerId);
    setChecking(true);

    const question = questions[currentIndex];

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

      if (data.is_correct) {
        setScore((current) => current + 1);
      }
    }

    setChecking(false);
  }

  function handleNext() {
    setSelectedAnswer(null);
    setResult(null);

    setCurrentIndex((current) => current + 1);
  }

  if (loading) {
    return <p>Loading lesson...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (questions.length === 0) {
    return <p>No questions found.</p>;
  }

  if (currentIndex >= questions.length) {
    return (
      <main>
        <h1>Lesson complete</h1>

        <p>
          You scored {score} out of {questions.length}.
        </p>

        <Link to="/learn">Back to Learn</Link>
      </main>
    );
  }

  const question = questions[currentIndex];

  return (
    <main>
      <p>
        Question {currentIndex + 1} of {questions.length}
      </p>

      <progress value={currentIndex + 1} max={questions.length} />

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

      {result && (
        <section>
          <h2>{result.is_correct ? "Correct!" : "Not quite"}</h2>

          <p>{result.explanation}</p>

          <button type="button" onClick={handleNext}>
            {currentIndex === questions.length - 1
              ? "See results"
              : "Next question"}
          </button>
        </section>
      )}
    </main>
  );
}
