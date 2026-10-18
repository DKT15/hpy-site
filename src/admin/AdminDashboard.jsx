import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

const CONTENT_TABLES = [
  {
    key: "topics",
    table: "topics",
    label: "Topics",
    description: "Organise Histopository into broad historical areas.",
    path: "/admin/topics",
  },

  {
    key: "courses",
    table: "courses",
    label: "Courses",
    description: "Build structured courses inside each topic.",
    path: "/admin/courses",
  },

  {
    key: "lessons",
    table: "lessons",
    label: "Lessons",
    description: "Create the individual learning experiences.",
    path: null,
  },

  {
    key: "questions",
    table: "questions",
    label: "Questions",
    description: "Manage quiz questions and Daily Challenge content.",
    path: null,
  },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    topics: 0,
    courses: 0,
    lessons: 0,
    questions: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      setLoading(true);
      setError("");

      const results = await Promise.all(
        CONTENT_TABLES.map(({ table }) =>
          supabase.from(table).select("*", {
            count: "exact",
            head: true,
          }),
        ),
      );

      if (!mounted) {
        return;
      }

      const failedResult = results.find((result) => result.error);

      if (failedResult) {
        console.error(
          "Could not load admin content counts:",
          failedResult.error,
        );

        setError("Could not load the content overview.");

        setLoading(false);

        return;
      }

      const nextCounts = {};

      CONTENT_TABLES.forEach(({ key }, index) => {
        nextCounts[key] = results[index].count ?? 0;
      });

      setCounts(nextCounts);
      setLoading(false);
    }

    loadCounts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">CONTENT MANAGEMENT</p>

          <h1>Histopository Admin</h1>

          <p>
            Create and manage the learning content that appears across
            Histopository.
          </p>
        </div>

        <div className="admin-status">
          <span className="admin-status-dot" />
          Admin access active
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">CONTENT</p>

            <h2>Content overview</h2>
          </div>

          <p>Manage Histopository learning structure.</p>
        </div>

        {error && <p className="admin-message error">{error}</p>}

        <div className="admin-card-grid">
          {CONTENT_TABLES.map((item) => (
            <article className="admin-content-card" key={item.key}>
              <div className="admin-content-card-top">
                <span>{loading ? "—" : counts[item.key]}</span>

                <small>{item.label}</small>
              </div>

              <h3>{item.label}</h3>

              <p>{item.description}</p>

              {item.path ? (
                <Link to={item.path} className="admin-coming-soon">
                  Manage {item.label.toLowerCase()} →
                </Link>
              ) : (
                <span className="admin-coming-soon">
                  Management coming next
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
