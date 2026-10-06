import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppLoading from "../components/AppLoading";

export default function ProfilePage() {
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

  if (loading) {
    return <AppLoading message="Loading your progress..." />;
  }

  if (!user) {
    return (
      <main>
        <h1>Your profile</h1>

        <p>Log in to view your progress, XP and streaks.</p>

        <Link to="/login">Log in or create an account</Link>
      </main>
    );
  }

  const completedLessons = progress.filter(
    (item) => item.status === "completed",
  ).length;

  return (
    <main>
      <h1>
        {profile?.display_name
          ? `${profile.display_name}'s profile`
          : "Your profile"}
      </h1>

      {profile?.avatar_url && (
        <img
          src={profile.avatar_url}
          alt="Profile avatar"
          width="96"
          height="96"
        />
      )}

      <p>{user.email}</p>

      <section>
        <h2>Your stats</h2>

        <p>Total XP: {profile?.total_xp ?? 0}</p>

        <p>Current streak: {profile?.current_streak ?? 0} days</p>

        <p>Longest streak: {profile?.longest_streak ?? 0} days</p>

        <p>Lessons completed: {completedLessons}</p>
      </section>

      <section>
        <h2>Profile</h2>

        <form onSubmit={handleSaveName}>
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

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save name"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>Profile picture</h2>

        <form onSubmit={handleAvatarUpload}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          />

          <button type="submit" disabled={!avatarFile || uploadingAvatar}>
            {uploadingAvatar ? "Uploading..." : "Upload picture"}
          </button>
        </form>

        {avatarMessage && <p>{avatarMessage}</p>}
      </section>

      <section>
        <h2>Lesson progress</h2>

        {progress.length === 0 ? (
          <p>You haven&apos;t completed any lessons yet.</p>
        ) : (
          progress.map((item) => (
            <div key={item.lessons.slug}>
              <h3>{item.lessons.name}</h3>

              <p>{item.lessons.courses.name}</p>

              <p>
                Best score: {item.best_score}/{item.best_total}
              </p>

              <p>Attempts: {item.attempt_count}</p>

              <Link to={`/lesson/${item.lessons.slug}`}>Play again</Link>
            </div>
          ))
        )}
      </section>

      <p>
        <Link to="/learn">Continue learning</Link>
      </p>
    </main>
  );
}
