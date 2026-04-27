import type { Member } from '../../types/member';
import StatusBadge from './StatusBadge';

/**
 * Defines member table row props used by feature UI behavior.
 */
interface MemberTableRowProps {
  /**
   * Data used for member behavior.
   */
  member: Member;
  /**
   * Data used for index behavior.
   */
  index: number;
  /**
   * Data used for is hovered behavior.
   */
  isHovered: boolean;
  /**
   * Callback fired when mouse enter.
   */
  onMouseEnter: () => void;
  /**
   * Callback fired when mouse leave.
   */
  onMouseLeave: () => void;
  /**
   * Callback fired when click.
   */
  onClick: () => void;
}

/**
 * Renders the member table row interface for feature UI behavior.
 *
 * @param params Input used by member table row.
 * @returns Rendered JSX output.
 */
export default function MemberTableRow({
  member,
  index,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: MemberTableRowProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        flex items-center min-h-[44px] px-4 sm:px-6 py-3 border-b border-neutral-200
        last:border-b-0 transition-all duration-200 cursor-pointer
        ${
          isHovered
            ? 'bg-warning'
            : index % 2 === 0
              ? 'bg-surface'
              : 'bg-surface-alt/50'
        }
      `}
    >
      <span
        title={`${member.firstName} ${member.lastName}`}
        className={`
          flex-1 min-w-0 text-sm text-left truncate
          ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}
        `}
      >
        {member.firstName} {member.lastName}
      </span>

      <span
        title={member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : 'N/A'}
        className={`
          flex-1 shrink-0 text-sm text-center truncate hidden sm:block
          ${isHovered ? 'text-secondary' : 'text-neutral-500'}
        `}
      >
        {member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : 'N/A'}
      </span>

      <div className="flex-1 flex justify-end">
        <StatusBadge
          status={member.status}
          className={`text-sm ${isHovered ? 'text-danger font-semibold' : ''}`}
        />
      </div>
    </div>
  );
}
