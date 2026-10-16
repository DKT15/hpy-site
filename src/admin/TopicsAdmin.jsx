import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

const EMPTY_FORM = {
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

export default function TopicsAdmin() {
  const [topics, setTopics] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  /* =======================================================
     LOAD TOPICS
     ======================================================= */

  async function loadTopics() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("topics")
      .select(
        `
          id,
          name,
          slug,
          description,
          image_url,
          status,
          sort_order,
          created_at,
          updated_at
        `,
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("Could not load admin topics:", error);

      setError("Could not load topics.");

      setLoading(false);

      return;
    }

    setTopics(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTopics();
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

      /*
        Automatically build the slug while creating
        a new topic.

        When editing, we do not overwrite the slug
        every time the name changes.
      */

      slug: editingId ? current.slug : createSlug(name),
    }));
  }

  function handleSlugChange(event) {
    setForm((current) => ({
      ...current,

      slug: createSlug(event.target.value),
    }));
  }

  function handleEdit(topic) {
    setEditingId(topic.id);

    setForm({
      name: topic.name ?? "",

      slug: topic.slug ?? "",

      description: topic.description ?? "",

      status: topic.status ?? "draft",

      sort_order: topic.sort_order ?? 0,
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

    const name = form.name.trim();

    const slug = createSlug(form.slug);

    const description = form.description.trim();

    const sortOrder = Number(form.sort_order);

    if (!name) {
      setError("Topic name is required.");

      setSaving(false);

      return;
    }

    if (!slug) {
      setError("Topic slug is required.");

      setSaving(false);

      return;
    }

    if (!Number.isInteger(sortOrder)) {
      setError("Sort order must be a whole number.");

      setSaving(false);

      return;
    }

    const payload = {
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
        .from("topics")
        .update(payload)
        .eq("id", editingId);

      saveError = error;
    } else {
      const { error } = await supabase.from("topics").insert(payload);

      saveError = error;
    }

    if (saveError) {
      console.error("Could not save topic:", saveError);

      if (saveError.code === "23505") {
        setError("That slug is already being used by another topic.");
      } else {
        setError("Could not save the topic.");
      }

      setSaving(false);

      return;
    }

    setMessage(editingId ? "Topic updated." : "Topic created.");

    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    await loadTopics();

    setSaving(false);
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return <AppLoading message="Loading topics..." />;
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="admin-dashboard">
      <section className="admin-page-heading">
        <div>
          <p className="admin-kicker">CONTENT</p>

          <h1>Topics</h1>

          <p>
            Create and organise the broad historical areas shown across
            Histopository.
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
              {editingId ? "EDIT TOPIC" : "NEW TOPIC"}
            </p>

            <h2>{editingId ? "Update topic" : "Add topic"}</h2>
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

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="topic-name">Name</label>

              <input
                id="topic-name"
                type="text"
                value={form.name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="topic-slug">Slug</label>

              <input
                id="topic-slug"
                type="text"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="ancient-history"
                required
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="topic-description">Description</label>

            <textarea
              id="topic-description"
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
              <label htmlFor="topic-status">Status</label>

              <select
                id="topic-status"
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
              <label htmlFor="topic-order">Sort order</label>

              <input
                id="topic-order"
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
            {saving ? "Saving..." : editingId ? "Save changes" : "Create topic"}
          </button>
        </form>
      </section>

      {/* ===================================================
          TOPIC LIST
          =================================================== */}

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">EXISTING CONTENT</p>

            <h2>Current topics</h2>
          </div>

          <p>
            {topics.length} {topics.length === 1 ? "topic" : "topics"}
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No topics yet</h3>

            <p>Create your first topic using the form above.</p>
          </div>
        ) : (
          <div className="admin-list">
            {topics.map((topic) => (
              <article className="admin-list-item" key={topic.id}>
                <div className="admin-list-main">
                  <div className="admin-list-title-row">
                    <h3>{topic.name}</h3>

                    <span className={`admin-status-badge ${topic.status}`}>
                      {topic.status}
                    </span>
                  </div>

                  <p className="admin-list-slug">/{topic.slug}</p>

                  {topic.description && (
                    <p className="admin-list-description">
                      {topic.description}
                    </p>
                  )}
                </div>

                <div className="admin-list-meta">
                  <span>Order {topic.sort_order}</span>

                  <button
                    type="button"
                    className="admin-secondary-action"
                    onClick={() => handleEdit(topic)}
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
