import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function LearnPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase
        .from("topics")
        .select(
          `
          id,
          name,
          description,
          courses (
            id,
            name,
            description,
            lessons (
              id,
              name,
              description,
              xp_reward
            )
          )
        `,
        )
        .order("sort_order");

      if (error) {
        console.error(error);
        setError("Could not load learning content.");
      } else {
        setTopics(data);
      }

      setLoading(false);
    }

    loadTopics();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <main>
      <h1>Learn History</h1>

      {topics.map((topic) => (
        <section key={topic.id}>
          <h2>{topic.name}</h2>
          <p>{topic.description}</p>

          {topic.courses.map((course) => (
            <div key={course.id}>
              <h3>{course.name}</h3>
              <p>{course.description}</p>

              {course.lessons.map((lesson) => (
                <div key={lesson.id}>
                  <strong>{lesson.name}</strong>
                  <p>{lesson.description}</p>
                  <p>{lesson.xp_reward} XP</p>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}

export default LearnPage;
