'use client';

type Props = {
  scope: string;
  label?: string;
  confirmText?: string;
  onDone?: () => void | Promise<void>;
  style?: React.CSSProperties;
};

/** Temporarily disabled — prevents accidental wipe of live Neon data. */
export const ADMIN_RESET_ENABLED = false;

/**
 * Reset-to-folder-defaults control.
 * Currently hidden/disabled so admins cannot overwrite live content by mistake.
 * Flip ADMIN_RESET_ENABLED to true (and re-enable the API) when safe to restore.
 */
export function AdminResetButton(_props: Props) {
  if (!ADMIN_RESET_ENABLED) {
    return null;
  }

  // Kept for when reset is re-enabled later — see git history for full button UI.
  return null;
}
