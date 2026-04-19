import type { MemberStatus } from '../../types/member';

/**
 * Type alias for badge variant in feature UI behavior.
 */
type BadgeVariant = 'text' | 'pill';

/**
 * Defines status badge props used by feature UI behavior.
 */
interface StatusBadgeProps {
  /**
   * Data used for status behavior.
   */
  status: MemberStatus;
  /**
   * Data used for variant behavior.
   */
  variant?: BadgeVariant;
  /**
   * Optional utility classes merged into the root element.
   */
  className?: string;
}

const statusStyles: Record<MemberStatus, { text: string; bg: string }> = {
  ACTIVE: { text: 'text-success', bg: 'bg-success/10' },
  EXPIRED: { text: 'text-danger', bg: 'bg-danger/10' },
  INACTIVE: { text: 'text-neutral-400', bg: 'bg-neutral-100' },
};

/**
 * Renders the status badge interface for feature UI behavior.
 *
 * @param params Input used by status badge.
 * @returns Rendered JSX output.
 */
export default function StatusBadge({
  status,
  variant = 'text',
  className,
}: StatusBadgeProps) {
  const style = statusStyles[status];

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${style.bg} ${style.text} ${className ?? ''}`}
      >
        {status}
      </span>
    );
  }

  return (
    <span className={`font-semibold uppercase ${style.text} ${className ?? ''}`}>
      {status}
    </span>
  );
}
