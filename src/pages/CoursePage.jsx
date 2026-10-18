import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

import "/styles/CoursePage.css";

function getRelationItem(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function CoursePage() {
  const { courseSlug } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError("");

      const { data, error: courseError } = await supabase
        .from("courses")
        .select(
          `
          id,
          topic_id,
          name,
          slug,
          description,
          image_url,
          status,
          sort_order,
          topics (
            id,
            name,
            slug,
            status
          ),
          lessons (
            id,
            name,
            slug,
            description,
            image_url,
            xp_reward,
            status,
            sort_order
          )
        `,
        )
        .eq("slug", courseSlug)
        .maybeSingle();

      if (courseError) {
        console.error("Could not load course:", courseError);

        setError("Could not load this course.");

        setLoading(false);

        return;
      }

      if (!data) {
        setError("This course could not be found.");

        setLoading(false);

        return;
      }

      const topic = getRelationItem(data.topics);

      /*
        Admins are deliberately allowed to read draft and
        archived content in Supabase.

        This learner-facing page therefore independently
        requires both the course and parent topic to be
        published.
      */

      if (data.status !== "published" || topic?.status !== "published") {
        setError("This course is not currently available.");

        setLoading(false);

        return;
      }

      const publishedLessons = (data.lessons ?? [])
        .filter((lesson) => lesson.status === "published")
        .sort((a, b) => a.sort_order - b.sort_order);

      setCourse({
        ...data,
        topic,
      });

      setLessons(publishedLessons);

      setLoading(false);
    }

    loadCourse();
  }, [courseSlug]);

  if (loading) {
    return <AppLoading message="Loading course..." />;
  }

  if (error) {
    return (
      <main className="course-page">
        <section className="course-state-card">
          <h1>Course unavailable</h1>

          <p>{error}</p>

          <Link to="/learn" className="course-primary-button">
            Back to learning
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="course-page">
      {/* ===================================================
          COURSE HERO
          =================================================== */}

      <section className="course-hero">
        <div className="course-hero-copy">
          <Link to="/learn" className="course-back-link">
            ← Back to learning
          </Link>

          <p className="course-eyebrow">{course.topic?.name ?? "HISTORY"}</p>

          <h1>{course.name}</h1>

          {course.description && (
            <p className="course-description">{course.description}</p>
          )}

          <div className="course-summary">
            <span>
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>
        </div>

        <div
          className={`course-hero-image ${
            course.image_url ? "has-image" : "no-image"
          }`}
        >
          {course.image_url ? (
            <img src={course.image_url} alt="" />
          ) : (
            <span aria-hidden="true">
              {course.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </section>

      {/* ===================================================
          LESSONS
          =================================================== */}

      <section className="course-lessons">
        <div className="course-section-heading">
          <div>
            <p className="course-eyebrow">COURSE CONTENT</p>

            <h2>Lessons</h2>
          </div>

          <span>
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </div>

        {lessons.length === 0 ? (
          <div className="course-empty-state">
            <h3>No lessons available yet</h3>

            <p>Lessons for this course are still being prepared.</p>
          </div>
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <article className="lesson-card" key={lesson.id}>
                <div className="lesson-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="lesson-card-content">
                  <div className="lesson-card-heading">
                    <div>
                      <p className="course-eyebrow">LESSON {index + 1}</p>

                      <h3>{lesson.name}</h3>
                    </div>

                    <span className="lesson-xp">{lesson.xp_reward} XP</span>
                  </div>

                  {lesson.description && (
                    <p className="lesson-description">{lesson.description}</p>
                  )}

                  <div className="lesson-card-footer">
                    <span>History lesson</span>

                    <Link
                      to={`/lesson/${lesson.slug}`}
                      className="course-primary-button"
                    >
                      Start lesson
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
