import type { ReactNode } from 'react';

/**
 * Defines profile info row props used by feature UI behavior.
 */
interface ProfileInfoRowProps {
  /**
   * Data used for label behavior.
   */
  label: string;
  /**
   * Value content rendered on the right side of the row.
   */
  value: ReactNode;
  /**
   * Optional class names applied to the value element.
   */
  valueClassName?: string;
}

/**
 * Renders the profile info row interface for feature UI behavior.
 *
 * @param params Input used by profile info row.
 * @returns Rendered JSX output.
 */
export default function ProfileInfoRow({
  label,
  value,
  valueClassName,
}: ProfileInfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-primary font-semibold text-sm sm:text-base">{label}</span>
      <span className={`text-secondary text-sm sm:text-base font-medium ${valueClassName ?? ''}`}>
        {value}
      </span>
    </div>
  );
}
