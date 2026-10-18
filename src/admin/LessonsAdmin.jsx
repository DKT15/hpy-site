import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

const EMPTY_FORM = {
  course_id: "",
  name: "",
  slug: "",
  description: "",
  xp_reward: 50,
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

function getRelationItem(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function LessonsAdmin() {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

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

    const [coursesResult, lessonsResult] = await Promise.all([
      supabase
        .from("courses")
        .select(
          `
          id,
          topic_id,
          name,
          status,
          sort_order,
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

      supabase
        .from("lessons")
        .select(
          `
          id,
          course_id,
          name,
          slug,
          description,
          image_url,
          xp_reward,
          status,
          sort_order,
          created_at,
          updated_at,
          courses (
            id,
            name,
            status,
            topic_id,
            topics (
              id,
              name,
              status
            )
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

    if (coursesResult.error) {
      console.error("Could not load admin courses:", coursesResult.error);

      setError("Could not load courses.");

      setLoading(false);

      return;
    }

    if (lessonsResult.error) {
      console.error("Could not load admin lessons:", lessonsResult.error);

      setError("Could not load lessons.");

      setLoading(false);

      return;
    }

    setCourses(coursesResult.data ?? []);

    setLessons(lessonsResult.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadContent();
  }, []);

  /* =======================================================
     FORM
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

  function handleEdit(lesson) {
    setEditingId(lesson.id);

    setForm({
      course_id: lesson.course_id ?? "",

      name: lesson.name ?? "",

      slug: lesson.slug ?? "",

      description: lesson.description ?? "",

      xp_reward: lesson.xp_reward ?? 50,

      status: lesson.status ?? "draft",

      sort_order: lesson.sort_order ?? 0,
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

    const courseId = form.course_id;

    const name = form.name.trim();

    const slug = createSlug(form.slug);

    const description = form.description.trim();

    const xpReward = Number(form.xp_reward);

    const sortOrder = Number(form.sort_order);

    if (!courseId) {
      setError("Please choose a course.");

      setSaving(false);

      return;
    }

    if (!name) {
      setError("Lesson name is required.");

      setSaving(false);

      return;
    }

    if (!slug) {
      setError("Lesson slug is required.");

      setSaving(false);

      return;
    }

    if (!Number.isInteger(xpReward) || xpReward < 0) {
      setError("XP reward must be a whole number of 0 or more.");

      setSaving(false);

      return;
    }

    if (!Number.isInteger(sortOrder)) {
      setError("Sort order must be a whole number.");

      setSaving(false);

      return;
    }

    const selectedCourse = courses.find((course) => course.id === courseId);

    const selectedTopic = getRelationItem(selectedCourse?.topics);

    if (form.status === "published" && selectedCourse?.status !== "published") {
      setError("Publish the parent course before publishing this lesson.");

      setSaving(false);

      return;
    }

    if (form.status === "published" && selectedTopic?.status !== "published") {
      setError("Publish the parent topic before publishing this lesson.");

      setSaving(false);

      return;
    }

    const payload = {
      course_id: courseId,

      name,

      slug,

      description: description || null,

      xp_reward: xpReward,

      status: form.status,

      sort_order: sortOrder,

      updated_at: new Date().toISOString(),
    };

    let saveError;

    if (editingId) {
      const { error } = await supabase
        .from("lessons")
        .update(payload)
        .eq("id", editingId);

      saveError = error;
    } else {
      const { error } = await supabase.from("lessons").insert(payload);

      saveError = error;
    }

    if (saveError) {
      console.error("Could not save lesson:", saveError);

      if (saveError.code === "23505") {
        setError("That slug is already being used by another lesson.");
      } else {
        setError("Could not save the lesson.");
      }

      setSaving(false);

      return;
    }

    setMessage(editingId ? "Lesson updated." : "Lesson created.");

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
    return <AppLoading message="Loading lessons..." />;
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <p className="admin-kicker">CONTENT</p>

          <h1>Lessons</h1>

          <p>
            Create the individual learning experiences inside each Histopository
            course.
          </p>
        </div>
      </section>

      {/* ===================================================
          EDITOR
          =================================================== */}

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">
              {editingId ? "EDIT LESSON" : "NEW LESSON"}
            </p>

            <h2>{editingId ? "Update lesson" : "Add lesson"}</h2>
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

        {courses.length === 0 ? (
          <div className="admin-empty-state">
            <h3>Create a course first</h3>

            <p>Lessons must belong to a course.</p>
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="lesson-course">Course</label>

              <select
                id="lesson-course"
                value={form.course_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    course_id: event.target.value,
                  }))
                }
                required
              >
                <option value="">Choose a course</option>

                {courses.map((course) => {
                  const topic = getRelationItem(course.topics);

                  return (
                    <option value={course.id} key={course.id}>
                      {topic?.name ? `${topic.name} → ` : ""}
                      {course.name}
                      {course.status !== "published"
                        ? ` (${course.status})`
                        : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="lesson-name">Name</label>

                <input
                  id="lesson-name"
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="lesson-slug">Slug</label>

                <input
                  id="lesson-slug"
                  type="text"
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="origins-of-rome"
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="lesson-description">Description</label>

              <textarea
                id="lesson-description"
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
                <label htmlFor="lesson-xp">XP reward</label>

                <input
                  id="lesson-xp"
                  type="number"
                  min="0"
                  step="1"
                  value={form.xp_reward}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      xp_reward: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="lesson-order">Sort order</label>

                <input
                  id="lesson-order"
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

            <div className="admin-field">
              <label htmlFor="lesson-status">Status</label>

              <select
                id="lesson-status"
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
                  : "Create lesson"}
            </button>
          </form>
        )}
      </section>

      {/* ===================================================
          LESSON LIST
          =================================================== */}

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">EXISTING CONTENT</p>

            <h2>Current lessons</h2>
          </div>

          <p>
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </p>
        </div>

        {lessons.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No lessons yet</h3>

            <p>Create your first lesson using the form above.</p>
          </div>
        ) : (
          <div className="admin-list">
            {lessons.map((lesson) => {
              const course = getRelationItem(lesson.courses);

              const topic = getRelationItem(course?.topics);

              return (
                <article className="admin-list-item" key={lesson.id}>
                  <div className="admin-list-main">
                    <div className="admin-list-title-row">
                      <h3>{lesson.name}</h3>

                      <span className={`admin-status-badge ${lesson.status}`}>
                        {lesson.status}
                      </span>
                    </div>

                    <p className="admin-list-slug">
                      {topic?.name ?? "Unknown topic"}
                      {" → "}
                      {course?.name ?? "Unknown course"}
                    </p>

                    <p className="admin-list-slug">/{lesson.slug}</p>

                    {lesson.description && (
                      <p className="admin-list-description">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  <div className="admin-list-meta">
                    <span>{lesson.xp_reward} XP</span>

                    <span>Order {lesson.sort_order}</span>

                    <button
                      type="button"
                      className="admin-secondary-action"
                      onClick={() => handleEdit(lesson)}
                    >
                      Edit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
