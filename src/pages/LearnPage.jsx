import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "/styles/LearnPage.css";
import AppLoading from "../components/AppLoading";

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function LearnPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);

      const today = getLocalDateString();

      const { data: dailyData, error: dailyError } = await supabase.rpc(
        "get_daily_challenge",
        {
          p_challenge_date: today,
        },
      );

      if (dailyError) {
        console.error("Could not load Daily Challenge:", dailyError);
      } else {
        const loadedDaily = Array.isArray(dailyData) ? dailyData[0] : dailyData;

        setDailyChallenge(loadedDaily ?? null);
      }

      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select(
          `
            id,
            name,
            slug,
            description,
            image_url,
            sort_order,
            courses (
              id,
              name,
              slug,
              description,
              image_url,
              sort_order,
              lessons (
                id,
                name,
                slug,
                description,
                xp_reward,
                sort_order
              )
            )
          `,
        )
        .order("sort_order");

      if (topicsError) {
        console.error(topicsError);
        setError("Could not load learning content.");
        setLoading(false);
        return;
      }

      setTopics(topicsData ?? []);

      if (user) {
        const [
          { data: profileData, error: profileError },
          { data: progressData, error: progressError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              `
              display_name,
              total_xp,
              current_streak,
              longest_streak
            `,
            )
            .eq("id", user.id)
            .single(),

          supabase
            .from("lesson_progress")
            .select(
              `
              status,
              best_score,
              best_total,
              attempt_count,
              updated_at,
              lessons (
                id,
                name,
                slug,
                course_id,
                courses (
                  id,
                  name,
                  slug
                )
              )
            `,
            )
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
        ]);

        if (profileError) {
          console.error(profileError);
        } else {
          setProfile(profileData);
        }

        if (progressError) {
          console.error(progressError);
        } else {
          setProgress(progressData ?? []);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <AppLoading message="Preparing your learning dashboard..." />;
  }

  if (error) {
    return (
      <main className="learn-page">
        <p>{error}</p>
      </main>
    );
  }

  const completedLessons = progress.filter(
    (item) => item.status === "completed",
  ).length;

  const recentProgress = progress[0];

  const allCourses = topics.flatMap((topic) =>
    (topic.courses ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((course) => ({
        ...course,
        topicName: topic.name,
      })),
  );

  const firstCourse = allCourses[0];

  const firstLesson = firstCourse?.lessons?.sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];

  const continueLesson = recentProgress?.lessons ?? firstLesson ?? null;

  const continueCourseName =
    recentProgress?.lessons?.courses?.name ?? firstCourse?.name ?? "";

  const displayName = profile?.display_name || "Historian";

  return (
    <main className="learn-page">
      <section className="learn-welcome">
        <div>
          <p className="learn-eyebrow">
            {user ? "WELCOME BACK" : "WELCOME TO HISTOPOSITORY"}
          </p>

          <h1>
            {user ? `Welcome back, ${displayName}` : "Explore history your way"}
          </h1>

          <p>
            {user
              ? "Keep learning, build your streak and discover something new."
              : "Play history quizzes freely. Create an account to save progress, earn XP and build a streak."}
          </p>
        </div>

        {user ? (
          <div className="learn-stats">
            <div>
              <strong>{profile?.current_streak ?? 0}</strong>
              <span>Day streak</span>
            </div>

            <div>
              <strong>{profile?.total_xp ?? 0}</strong>
              <span>Total XP</span>
            </div>
          </div>
        ) : (
          <Link to="/login" className="learn-primary-button">
            Create free account
          </Link>
        )}
      </section>

      <section className="learn-section">
        <div className="learn-section-heading">
          <div>
            <p className="learn-section-kicker">KEEP GOING</p>
            <h2>Continue learning</h2>
          </div>
        </div>

        {continueLesson ? (
          <div className="continue-card">
            <div className="continue-card-image">
              <img src="/hero-art.webp" alt="" />
            </div>

            <div className="continue-card-content">
              <span>{continueCourseName}</span>

              <h3>{continueLesson.name}</h3>

              <p>
                {recentProgress
                  ? `Best score ${recentProgress.best_score}/${recentProgress.best_total}`
                  : "Start your first Histopository lesson."}
              </p>

              <Link
                to={`/lesson/${continueLesson.slug}`}
                className="learn-primary-button"
              >
                {recentProgress ? "Continue" : "Start lesson"}
              </Link>
            </div>
          </div>
        ) : (
          <p>More learning content is coming soon.</p>
        )}
      </section>

      <section className="learn-feature-grid">
        <article className="learn-feature-card daily-card">
          <span className="feature-icon">
            {dailyChallenge?.attempt ? "🔒" : "◆"}
          </span>

          <div>
            <p className="learn-section-kicker">DAILY HISTORY</p>

            <h2>
              {dailyChallenge?.attempt
                ? "Challenge completed"
                : "Today's challenge"}
            </h2>

            {dailyChallenge?.attempt ? (
              <p>
                You scored {dailyChallenge.attempt.score}/
                {dailyChallenge.attempt.total_questions} and earned{" "}
                {dailyChallenge.attempt.xp_earned} XP. A new challenge will be
                available tomorrow.
              </p>
            ) : dailyChallenge ? (
              <p>
                Five questions. One attempt. Come back each day to build your
                streak.
              </p>
            ) : (
              <p>There isn&apos;t a Daily Challenge available today.</p>
            )}
          </div>

          {dailyChallenge?.attempt ? (
            <span
              className="learn-secondary-button daily-complete-button"
              aria-label="Daily Challenge completed and locked until tomorrow"
            >
              🔒 Completed today
            </span>
          ) : dailyChallenge ? (
            <Link to="/daily" className="learn-primary-button">
              Play today
            </Link>
          ) : (
            <span className="daily-unavailable">No challenge today</span>
          )}
        </article>

        <article className="learn-feature-card">
          <span className="feature-icon">↗</span>

          <div>
            <p className="learn-section-kicker">YOUR PROGRESS</p>
            <h2>{completedLessons} lessons completed</h2>

            <p>Track your scores, attempts, XP and learning history.</p>
          </div>

          {user ? (
            <Link to="/profile" className="learn-secondary-button">
              View progress
            </Link>
          ) : (
            <Link to="/login" className="learn-secondary-button">
              Log in
            </Link>
          )}
        </article>

        <article className="learn-feature-card">
          <span className="feature-icon">★</span>

          <div>
            <p className="learn-section-kicker">MASTERY</p>
            <h2>
              {user
                ? `${profile?.total_xp ?? 0} XP earned`
                : "Earn XP as you learn"}
            </h2>

            <p>
              Better scores earn more XP, with bonuses for strong first
              attempts.
            </p>
          </div>
        </article>
      </section>

      <section className="learn-section">
        <div className="learn-section-heading">
          <div>
            <p className="learn-section-kicker">EXPLORE</p>
            <h2>History topics</h2>
          </div>
        </div>

        <div className="course-grid">
          {allCourses.map((course, index) => {
            const lessonCount = course.lessons?.length ?? 0;

            return (
              <article className="course-card" key={course.id}>
                <div
                  className={`course-card-image course-image-${(index % 4) + 1}`}
                >
                  {course.image_url ? (
                    <img src={course.image_url} alt="" />
                  ) : (
                    <span>{course.name.charAt(0)}</span>
                  )}
                </div>

                <div className="course-card-body">
                  <span>{course.topicName}</span>

                  <h3>{course.name}</h3>

                  <p>{course.description}</p>

                  <div className="course-card-footer">
                    <span>
                      {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                    </span>

                    {course.lessons?.[0] && (
                      <Link to={`/lesson/${course.lessons[0].slug}`}>
                        Explore →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
