import { Search } from 'lucide-react';

/**
 * Defines search bar props used by shared UI behavior.
 */
interface SearchBarProps {
  /**
   * Current selected value.
   */
  value: string;
  /**
   * Callback fired when change.
   */
  onChange: (value: string) => void;
  /**
   * Data used for placeholder behavior.
   */
  placeholder?: string;
  /**
   * Disables user interaction when true.
   */
  disabled?: boolean;
  /**
   * Optional utility classes merged into the root element.
   */
  className?: string;
  /**
   * Data used for input class name behavior.
   */
  inputClassName?: string;
  /**
   * Data used for show icon behavior.
   */
  showIcon?: boolean;
}

/**
 * Handles join classes for shared UI behavior.
 *
 * @param classes Input consumed by join classes.
 * @returns Computed value for the caller.
 */
function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Renders the search bar interface for shared UI behavior.
 *
 * @param params Input used by search bar.
 * @returns Rendered JSX output.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className,
  inputClassName,
  showIcon = true,
}: SearchBarProps) {
  return (
    <div className={joinClasses('relative', className)}>
      {showIcon && (
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={joinClasses(
          showIcon ? 'pl-9' : 'pl-4',
          'w-full pr-4 py-2.5 rounded-lg border text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          inputClassName,
        )}
      />
    </div>
  );
}
