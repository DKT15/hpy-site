import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PropTypes from "prop-types";

import "../../styles/AdminImageUploader.css";

const BUCKET = "content-images";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ContentImageUploader({
  itemId,
  folder,
  currentImageUrl,
  onImageChange,
}) {
  const [selectedFile, setSelectedFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [uploading, setUploading] = useState(false);

  const [removing, setRemoving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  /* =======================================================
     LOCAL PREVIEW
     ======================================================= */

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");

      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  /* =======================================================
     FILE SELECTION
     ======================================================= */

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;

    setError("");
    setMessage("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Images must be 5 MB or smaller.");

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  }

  /* =======================================================
     UPLOAD / REPLACE
     ======================================================= */

  async function handleUpload() {
    if (!selectedFile || !itemId) {
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    /*
      Keep one stable object path per content item.

      The actual image type is stored as Storage metadata,
      so the object does not need a filename extension.
    */

    const storagePath = `${folder}/${itemId}/cover`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, selectedFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: selectedFile.type,
      });

    if (uploadError) {
      console.error("Could not upload content image:", uploadError);

      setError("Could not upload the image.");

      setUploading(false);

      return;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    if (!publicData?.publicUrl) {
      setError("The image uploaded, but its public URL could not be created.");

      setUploading(false);

      return;
    }

    /*
      Cache-busting query string ensures a replacement
      appears immediately even though the object path
      itself remains stable.
    */

    const imageUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    try {
      await onImageChange(imageUrl);
    } catch (changeError) {
      console.error("Could not save content image URL:", changeError);

      setError(
        "The image uploaded, but could not be attached to this content item.",
      );

      setUploading(false);

      return;
    }

    setSelectedFile(null);

    setMessage(currentImageUrl ? "Image replaced." : "Image uploaded.");

    setUploading(false);
  }

  /* =======================================================
     REMOVE
     ======================================================= */

  async function handleRemove() {
    if (!itemId || !currentImageUrl) {
      return;
    }

    setRemoving(true);
    setError("");
    setMessage("");

    const storagePath = `${folder}/${itemId}/cover`;

    /*
      Remove the database reference first.

      If Storage deletion subsequently fails, the orphaned
      object is harmless and can be cleaned up later.
    */

    try {
      await onImageChange(null);
    } catch (changeError) {
      console.error("Could not remove content image URL:", changeError);

      setError("Could not remove the image.");

      setRemoving(false);

      return;
    }

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.error("Could not delete content image object:", storageError);

      /*
        The topic is already safely detached from the image,
        so this is not treated as a failed user operation.
      */
    }

    setSelectedFile(null);

    setMessage("Image removed.");

    setRemoving(false);
  }

  const displayedImage = previewUrl || currentImageUrl || "";

  return (
    <div className="admin-image-uploader">
      <div className="admin-image-uploader-heading">
        <div>
          <label htmlFor={`content-image-${itemId}`}>Content image</label>

          <p>JPEG, PNG or WebP. Maximum 5 MB.</p>
        </div>
      </div>

      <div className="admin-image-uploader-body">
        <div
          className={`admin-image-preview ${
            displayedImage ? "has-image" : "no-image"
          }`}
        >
          {displayedImage ? (
            <img src={displayedImage} alt="Content preview" />
          ) : (
            <span>No image</span>
          )}
        </div>

        <div className="admin-image-controls">
          <input
            id={`content-image-${itemId}`}
            className="admin-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading || removing}
          />

          {selectedFile && (
            <div className="admin-image-file-info">
              <strong>{selectedFile.name}</strong>

              <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          <div className="admin-image-actions">
            <button
              type="button"
              className="admin-primary-action"
              onClick={handleUpload}
              disabled={!selectedFile || uploading || removing}
            >
              {uploading
                ? "Uploading..."
                : currentImageUrl
                  ? "Replace image"
                  : "Upload image"}
            </button>

            {currentImageUrl && (
              <button
                type="button"
                className="admin-image-remove"
                onClick={handleRemove}
                disabled={uploading || removing}
              >
                {removing ? "Removing..." : "Remove image"}
              </button>
            )}
          </div>

          {error && <p className="admin-message error">{error}</p>}

          {message && <p className="admin-message success">{message}</p>}
        </div>
      </div>
    </div>
  );
}

ContentImageUploader.propTypes = {
  itemId: PropTypes.string.isRequired,
  folder: PropTypes.string.isRequired,
  currentImageUrl: PropTypes.string,
  onImageChange: PropTypes.func.isRequired,
};
