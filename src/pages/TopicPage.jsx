import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

import "/styles/TopicPage.css";

export default function TopicPage() {
  const { topicSlug } = useParams();

  const [topic, setTopic] = useState(null);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTopic() {
      setLoading(true);
      setError("");

      const { data, error: topicError } = await supabase
        .from("topics")
        .select(
          `
          id,
          name,
          eyebrow,
          slug,
          description,
          image_url,
          status,
          sort_order,
          courses (
            id,
            name,
            slug,
            description,
            image_url,
            status,
            sort_order,
            lessons (
              id,
              name,
              slug,
              status,
              sort_order
            )
          )
        `,
        )
        .eq("slug", topicSlug)
        .maybeSingle();

      if (topicError) {
        console.error("Could not load topic:", topicError);

        setError("Could not load this topic.");

        setLoading(false);

        return;
      }

      if (!data) {
        setError("This topic could not be found.");

        setLoading(false);

        return;
      }

      /*
        Admins can read draft/archived content through RLS.

        The learner-facing site must therefore explicitly
        refuse unpublished topics.
      */

      if (data.status !== "published") {
        setError("This topic is not currently available.");

        setLoading(false);

        return;
      }

      const publishedCourses = (data.courses ?? [])
        .filter((course) => course.status === "published")
        .map((course) => ({
          ...course,

          lessons: (course.lessons ?? [])
            .filter((lesson) => lesson.status === "published")
            .sort((a, b) => a.sort_order - b.sort_order),
        }))
        .sort((a, b) => a.sort_order - b.sort_order);

      setTopic(data);

      setCourses(publishedCourses);

      setLoading(false);
    }

    loadTopic();
  }, [topicSlug]);

  if (loading) {
    return <AppLoading message="Loading topic..." />;
  }

  if (error) {
    return (
      <main className="topic-page">
        <section className="topic-state-card">
          <h1>Topic unavailable</h1>

          <p>{error}</p>

          <Link to="/learn" className="topic-primary-button">
            Back to learning
          </Link>
        </section>
      </main>
    );
  }

  const totalLessons = courses.reduce(
    (total, course) => total + (course.lessons?.length ?? 0),
    0,
  );

  return (
    <main className="topic-page">
      {/* ===================================================
          TOPIC HERO
          =================================================== */}

      <section className="topic-hero">
        <div className="topic-hero-copy">
          <Link to="/learn" className="topic-back-link">
            ← Back to topics
          </Link>

          <p className="topic-eyebrow">{topic.eyebrow || "HISTORY TOPIC"}</p>

          <h1>{topic.name}</h1>

          {topic.description && (
            <p className="topic-description">{topic.description}</p>
          )}

          <div className="topic-summary">
            <span>
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>

            <span>
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
          </div>
        </div>

        <div
          className={`topic-hero-image ${
            topic.image_url ? "has-image" : "no-image"
          }`}
        >
          {topic.image_url ? (
            <img src={topic.image_url} alt="" />
          ) : (
            <span aria-hidden="true">{topic.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </section>

      {/* ===================================================
          COURSES
          =================================================== */}

      <section className="topic-courses">
        <div className="topic-section-heading">
          <div>
            <p className="topic-eyebrow">EXPLORE</p>

            <h2>Courses</h2>
          </div>

          <span>
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="topic-empty-state">
            <h3>No courses available yet</h3>

            <p>Courses for this topic are still being prepared.</p>
          </div>
        ) : (
          <div className="topic-course-grid">
            {courses.map((course, index) => {
              const lessonCount = course.lessons?.length ?? 0;

              return (
                <article className="topic-course-card" key={course.id}>
                  <div
                    className={`topic-course-image topic-course-image-${
                      (index % 4) + 1
                    } ${course.image_url ? "has-image" : "no-image"}`}
                  >
                    {course.image_url ? (
                      <img src={course.image_url} alt="" />
                    ) : (
                      <span aria-hidden="true">
                        {course.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="topic-course-body">
                    <p className="topic-eyebrow">COURSE</p>

                    <h3>{course.name}</h3>

                    {course.description && (
                      <p className="topic-course-description">
                        {course.description}
                      </p>
                    )}

                    <div className="topic-course-footer">
                      <span>
                        {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                      </span>

                      <Link to={`/course/${course.slug}`}>Explore →</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
