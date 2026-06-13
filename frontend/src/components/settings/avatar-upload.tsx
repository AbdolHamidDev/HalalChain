"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, Upload, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvatarUploadProps {
  /** The user's display name — used to derive initials fallback */
  name: string;
  /** Current avatar URL (null / undefined = show initials) */
  avatarUrl?: string | null;
  /** Called after a successful upload (new URL) or removal (null) */
  onAvatarChange: (newAvatarUrl: string | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// AvatarUpload component
// ---------------------------------------------------------------------------

/**
 * Displays the user's current avatar (or an initials fallback), lets them
 * pick a new image with a live preview, validates it client-side, then
 * uploads / removes it via the API.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10, 13.2
 */
export function AvatarUpload({ name, avatarUrl, onAvatarChange }: AvatarUploadProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /** Object URL for the local preview before upload is confirmed */
  const [preview, setPreview] = useState<string | null>(null);
  /** The File the user picked and hasn't uploaded yet */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  /** Client-side validation error message */
  const [validationError, setValidationError] = useState<string | null>(null);
  /** True while upload request is in-flight */
  const [uploading, setUploading] = useState(false);
  /** True while delete request is in-flight */
  const [removing, setRemoving] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Clean up Object URLs when preview changes to avoid memory leaks (Req 5.2)
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
    // We intentionally only run cleanup when preview changes or on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isBusy = uploading || removing;
  const initials = getInitials(name);

  // -------------------------------------------------------------------------
  // File-picker onChange handler
  // -------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input value so selecting the same file again still triggers onChange
    e.target.value = "";

    if (!file) return;

    // Clear any previous validation error
    setValidationError(null);

    // Validate file size (Req 5.4)
    if (file.size > MAX_FILE_SIZE) {
      setValidationError("File must be under 5 MB");
      return;
    }

    // Validate MIME type (Req 5.5)
    if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
      setValidationError("Accepted formats: JPEG, PNG, GIF, WebP");
      return;
    }

    // Revoke the previous preview URL before creating a new one
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    // Create a local preview (Req 5.2)
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setPendingFile(file);
  }

  // -------------------------------------------------------------------------
  // Upload handler — confirms the pending file and sends it to the server
  // -------------------------------------------------------------------------

  async function handleUpload() {
    if (!pendingFile) return;

    setUploading(true);
    try {
      const { user: updated } = await api.uploadAvatar(pendingFile);
      // Clear the local preview before propagating the new server URL
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      setPendingFile(null);
      onAvatarChange(updated.avatarUrl ?? null);
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload avatar. Please try again.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Cancel preview — discard chosen file without uploading
  // -------------------------------------------------------------------------

  function handleCancelPreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setPendingFile(null);
    setValidationError(null);
  }

  // -------------------------------------------------------------------------
  // Remove avatar — deletes server-side file and clears avatarUrl (Req 5.8, 5.9)
  // -------------------------------------------------------------------------

  async function handleRemove() {
    setRemoving(true);
    try {
      await api.deleteAvatar();
      onAvatarChange(null);
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove avatar. Please try again.";
      toast.error(message);
    } finally {
      setRemoving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex items-start gap-4">
      {/* ----------------------------------------------------------------- */}
      {/* Avatar display area                                                */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative shrink-0">
        {/* Avatar image or initials fallback */}
        {preview ? (
          // Local preview before upload (Req 5.2)
          <img
            src={preview}
            alt="Avatar preview"
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : avatarUrl ? (
          // Current server avatar (Req 5.1)
          <img
            src={avatarUrl}
            alt={`${name}'s avatar`}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          // Initials fallback (Req 5.9, 1.2)
          <div
            aria-label={`${name} initials`}
            className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-semibold select-none"
          >
            {initials}
          </div>
        )}

        {/* Spinner overlay while uploading or removing (Req 5.6, 13.2) */}
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 text-white animate-spin" aria-label="Loading" />
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Controls                                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        {/* Hidden file input (Req 5.3) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {preview ? (
          // ---- Preview mode: Confirm upload or cancel ----
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={handleUpload}
              aria-label="Confirm upload"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleCancelPreview}
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        ) : (
          // ---- Normal mode: Pick a file or remove avatar ----
          <div className="flex gap-2 flex-wrap">
            {/* Upload / Change photo button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              aria-label={avatarUrl ? "Change avatar photo" : "Upload avatar photo"}
            >
              <Upload className="h-4 w-4" />
              {avatarUrl ? "Change Photo" : "Upload Photo"}
            </Button>

            {/* Remove button — only visible when an avatar is set (Req 5.8, 5.9) */}
            {avatarUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isBusy}
                onClick={handleRemove}
                aria-label="Remove avatar photo"
              >
                {removing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Photo
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Accepted formats hint */}
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, GIF or WebP · Max 5 MB
        </p>

        {/* Client-side validation error (Req 5.4, 5.5) */}
        {validationError && (
          <p className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}
      </div>
    </div>
  );
}
