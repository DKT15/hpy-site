import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

const EMPTY_FORM = {
  topic_id: "",
  name: "",
  slug: "",
  description: "",
  status: "draft",
  sort_order: 0,
};

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CoursesAdmin() {
  const [topics, setTopics] = useState([]);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  /* =======================================================
     LOAD CONTENT
     ======================================================= */

  async function loadContent() {
    setLoading(true);
    setError("");

    const [topicsResult, coursesResult] = await Promise.all([
      supabase
        .from("topics")
        .select(
          `
          id,
          name,
          status,
          sort_order
        `,
        )
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        }),

      supabase
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
          created_at,
          updated_at,
          topics (
            id,
            name,
            status
          )
        `,
        )
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        }),
    ]);

    if (topicsResult.error) {
      console.error("Could not load admin topics:", topicsResult.error);

      setError("Could not load topics.");

      setLoading(false);

      return;
    }

    if (coursesResult.error) {
      console.error("Could not load admin courses:", coursesResult.error);

      setError("Could not load courses.");

      setLoading(false);

      return;
    }

    setTopics(topicsResult.data ?? []);

    setCourses(coursesResult.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadContent();
  }, []);

  /* =======================================================
     FORM HELPERS
     ======================================================= */

  function resetForm() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setMessage("");
  }

  function handleNameChange(event) {
    const name = event.target.value;

    setForm((current) => ({
      ...current,

      name,

      slug: editingId ? current.slug : createSlug(name),
    }));
  }

  function handleSlugChange(event) {
    setForm((current) => ({
      ...current,

      slug: createSlug(event.target.value),
    }));
  }

  function handleEdit(course) {
    setEditingId(course.id);

    setForm({
      topic_id: course.topic_id ?? "",

      name: course.name ?? "",

      slug: course.slug ?? "",

      description: course.description ?? "",

      status: course.status ?? "draft",

      sort_order: course.sort_order ?? 0,
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     SAVE
     ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const topicId = form.topic_id;

    const name = form.name.trim();

    const slug = createSlug(form.slug);

    const description = form.description.trim();

    const sortOrder = Number(form.sort_order);

    if (!topicId) {
      setError("Please choose a topic.");

      setSaving(false);

      return;
    }

    if (!name) {
      setError("Course name is required.");

      setSaving(false);

      return;
    }

    if (!slug) {
      setError("Course slug is required.");

      setSaving(false);

      return;
    }

    if (!Number.isInteger(sortOrder)) {
      setError("Sort order must be a whole number.");

      setSaving(false);

      return;
    }

    const selectedTopic = topics.find((topic) => topic.id === topicId);

    /*
      Avoid publishing a course underneath a topic
      which itself is not published.

      This is a CMS UX rule rather than the security
      boundary — Supabase RLS remains the real access
      control.
    */

    if (form.status === "published" && selectedTopic?.status !== "published") {
      setError("Publish the parent topic before publishing this course.");

      setSaving(false);

      return;
    }

    const payload = {
      topic_id: topicId,

      name,

      slug,

      description: description || null,

      status: form.status,

      sort_order: sortOrder,

      updated_at: new Date().toISOString(),
    };

    let saveError;

    if (editingId) {
      const { error } = await supabase
        .from("courses")
        .update(payload)
        .eq("id", editingId);

      saveError = error;
    } else {
      const { error } = await supabase.from("courses").insert(payload);

      saveError = error;
    }

    if (saveError) {
      console.error("Could not save course:", saveError);

      if (saveError.code === "23505") {
        setError("That slug is already being used by another course.");
      } else {
        setError("Could not save the course.");
      }

      setSaving(false);

      return;
    }

    setMessage(editingId ? "Course updated." : "Course created.");

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    await loadContent();

    setSaving(false);
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return <AppLoading message="Loading courses..." />;
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <p className="admin-kicker">CONTENT</p>

          <h1>Courses</h1>

          <p>Build structured courses inside each Histopository topic.</p>
        </div>
      </section>

      {/* ===================================================
          EDITOR
          =================================================== */}

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">
              {editingId ? "EDIT COURSE" : "NEW COURSE"}
            </p>

            <h2>{editingId ? "Update course" : "Add course"}</h2>
          </div>

          {editingId && (
            <button
              type="button"
              className="admin-text-button"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="admin-empty-state">
            <h3>Create a topic first</h3>

            <p>Courses must belong to a topic.</p>
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="course-topic">Topic</label>

              <select
                id="course-topic"
                value={form.topic_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    topic_id: event.target.value,
                  }))
                }
                required
              >
                <option value="">Choose a topic</option>

                {topics.map((topic) => (
                  <option value={topic.id} key={topic.id}>
                    {topic.name}
                    {topic.status !== "published" ? ` (${topic.status})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="course-name">Name</label>

                <input
                  id="course-name"
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="course-slug">Slug</label>

                <input
                  id="course-slug"
                  type="text"
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="ancient-rome"
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="course-description">Description</label>

              <textarea
                id="course-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    description: event.target.value,
                  }))
                }
                rows={5}
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="course-status">Status</label>

                <select
                  id="course-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      status: event.target.value,
                    }))
                  }
                >
                  <option value="draft">Draft</option>

                  <option value="published">Published</option>

                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="course-order">Sort order</label>

                <input
                  id="course-order"
                  type="number"
                  step="1"
                  value={form.sort_order}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      sort_order: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {error && <p className="admin-message error">{error}</p>}

            {message && <p className="admin-message success">{message}</p>}

            <button
              type="submit"
              className="admin-primary-action"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create course"}
            </button>
          </form>
        )}
      </section>

      {/* ===================================================
          COURSE LIST
          =================================================== */}

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">EXISTING CONTENT</p>

            <h2>Current courses</h2>
          </div>

          <p>
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No courses yet</h3>

            <p>Create your first course using the form above.</p>
          </div>
        ) : (
          <div className="admin-list">
            {courses.map((course) => (
              <article className="admin-list-item" key={course.id}>
                <div className="admin-list-main">
                  <div className="admin-list-title-row">
                    <h3>{course.name}</h3>

                    <span className={`admin-status-badge ${course.status}`}>
                      {course.status}
                    </span>
                  </div>

                  <p className="admin-list-slug">
                    Topic: {course.topics?.name ?? "Unknown topic"}
                  </p>

                  <p className="admin-list-slug">/{course.slug}</p>

                  {course.description && (
                    <p className="admin-list-description">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="admin-list-meta">
                  <span>Order {course.sort_order}</span>

                  <button
                    type="button"
                    className="admin-secondary-action"
                    onClick={() => handleEdit(course)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
