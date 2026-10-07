import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";
import "../../styles/ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState([]);

  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [message, setMessage] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const [
        { data: profileData, error: profileError },
        { data: progressData, error: progressError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            `
            display_name,
            avatar_url,
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
            lessons (
              name,
              slug,
              courses (
                name
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
        setDisplayName(profileData.display_name ?? "");
      }

      if (progressError) {
        console.error(progressError);
      } else {
        setProgress(progressData ?? []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSaveName(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const name = displayName.trim();

    const { error } = await supabase.rpc("update_display_name", {
      p_display_name: name,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setProfile((current) => ({
        ...current,
        display_name: name,
      }));

      setMessage("Profile updated.");
    }

    setSaving(false);
  }

  async function handleAvatarUpload(event) {
    event.preventDefault();

    if (!avatarFile || !user) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(avatarFile.type)) {
      setAvatarMessage("Please choose a JPG, PNG or WebP image.");
      return;
    }

    if (avatarFile.size > 2 * 1024 * 1024) {
      setAvatarMessage("Profile image must be smaller than 2 MB.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage("");

    const filePath = `${user.id}/avatar`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error(uploadError);
      setAvatarMessage("Could not upload profile image.");
      setUploadingAvatar(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const avatarUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase.rpc("update_avatar_url", {
      p_avatar_url: avatarUrl,
    });

    if (profileError) {
      console.error(profileError);
      setAvatarMessage("Could not update your profile image.");
    } else {
      setProfile((current) => ({
        ...current,
        avatar_url: avatarUrl,
      }));

      setAvatarFile(null);
      setAvatarMessage("Profile image updated.");
    }

    setUploadingAvatar(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      console.error("Could not log out:", error);
      setLoggingOut(false);
      return;
    }

    navigate("/learn");
  }

  if (loading) {
    return <AppLoading message="Loading your progress..." />;
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-login-card">
          <h1>Your profile</h1>

          <p>Log in to save progress, earn XP and build your history streak.</p>

          <Link to="/login" className="profile-primary-button">
            Log in or create an account
          </Link>
        </section>
      </main>
    );
  }

  const completedLessons = progress.filter(
    (item) => item.status === "completed",
  ).length;

  const displayTitle = profile?.display_name || "Historian";

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={`${displayTitle}'s profile`} />
          ) : (
            <span>{displayTitle.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="profile-hero-copy">
          <p className="profile-kicker">YOUR HISTOPOSITORY</p>

          <h1>{displayTitle}</h1>

          <p>{user.email}</p>
        </div>
      </section>

      <section className="profile-stats">
        <div>
          <strong>{profile?.total_xp ?? 0}</strong>
          <span>Total XP</span>
        </div>

        <div>
          <strong>{profile?.current_streak ?? 0}</strong>
          <span>Current streak</span>
        </div>

        <div>
          <strong>{profile?.longest_streak ?? 0}</strong>
          <span>Longest streak</span>
        </div>

        <div>
          <strong>{completedLessons}</strong>
          <span>Lessons completed</span>
        </div>
      </section>

      <div className="profile-grid">
        <section className="profile-card">
          <p className="profile-kicker">PROFILE DETAILS</p>

          <h2>Edit profile</h2>

          <form className="profile-form" onSubmit={handleSaveName}>
            <label htmlFor="display-name">Display name</label>

            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={40}
              required
            />

            <button
              type="submit"
              className="profile-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save name"}
            </button>
          </form>

          {message && <p className="profile-message">{message}</p>}
        </section>

        <section className="profile-card">
          <p className="profile-kicker">PROFILE PICTURE</p>

          <h2>Change avatar</h2>

          <p className="profile-card-copy">
            Upload a JPG, PNG or WebP image up to 2 MB.
          </p>

          <form className="profile-form" onSubmit={handleAvatarUpload}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setAvatarFile(event.target.files?.[0] ?? null)
              }
            />

            <button
              type="submit"
              className="profile-secondary-button"
              disabled={!avatarFile || uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading..." : "Upload picture"}
            </button>
          </form>

          {avatarMessage && <p className="profile-message">{avatarMessage}</p>}
        </section>
      </div>

      <section className="profile-progress-section">
        <div className="profile-section-heading">
          <div>
            <p className="profile-kicker">LEARNING HISTORY</p>

            <h2>Lesson progress</h2>
          </div>

          <Link to="/learn">Continue learning →</Link>
        </div>

        {progress.length === 0 ? (
          <div className="profile-empty">
            <h3>Your journey starts here</h3>

            <p>
              Complete your first lesson and your progress will appear here.
            </p>

            <Link to="/learn" className="profile-primary-button">
              Start learning
            </Link>
          </div>
        ) : (
          <div className="profile-progress-list">
            {progress.map((item) => {
              if (!item.lessons) {
                return null;
              }

              return (
                <article
                  className="profile-progress-card"
                  key={item.lessons.slug}
                >
                  <div>
                    <span>
                      {item.lessons.courses?.name ?? "History course"}
                    </span>

                    <h3>{item.lessons.name}</h3>

                    <p>
                      Best score: {item.best_score}/{item.best_total}
                    </p>
                  </div>

                  <div className="profile-progress-meta">
                    <span>
                      {item.attempt_count}{" "}
                      {item.attempt_count === 1 ? "attempt" : "attempts"}
                    </span>

                    <Link to={`/lesson/${item.lessons.slug}`}>
                      Practice again →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="profile-account">
        <div>
          <h2>Account</h2>

          <p>Sign out of Histopository on this device.</p>
        </div>

        <button
          type="button"
          className="profile-logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
}
