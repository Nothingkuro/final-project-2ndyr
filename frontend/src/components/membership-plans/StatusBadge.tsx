interface StatusBadgeProps {
  /** Whether the item is active */
  isActive: boolean;
  /** Optional custom labels; defaults to "Active" / "Archived" */
  activeLabel?: string;
  archivedLabel?: string;
}

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
