/**
 * Defines status badge props used by feature UI behavior.
 */
interface StatusBadgeProps {
  /** Whether the item is active */
  /**
   * Data used for is active behavior.
   */
  isActive: boolean;
  /** Optional custom labels; defaults to "Active" / "Archived" */
  /**
   * Data used for active label behavior.
   */
  activeLabel?: string;
  /**
   * Data used for archived label behavior.
   */
  archivedLabel?: string;
}

/**
 * Renders the status badge interface for feature UI behavior.
 *
 * @param params Input used by status badge.
 * @returns Rendered JSX output.
 */
export default function StatusBadge({
  isActive,
  activeLabel = 'Active',
  archivedLabel = 'Archived',
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        transition-colors duration-200 select-none
        ${
          isActive
            ? 'bg-success/15 text-success'
            : 'bg-neutral-300/40 text-neutral-500'
        }
      `}
    >
      <span
        className={`
          inline-block w-1.5 h-1.5 rounded-full
          ${isActive ? 'bg-success' : 'bg-neutral-400'}
        `}
      />
      {isActive ? activeLabel : archivedLabel}
    </span>
  );
}
