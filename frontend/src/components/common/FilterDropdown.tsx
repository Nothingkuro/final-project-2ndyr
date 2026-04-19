import { ChevronDown } from 'lucide-react';

/**
 * Defines filter dropdown props used by shared UI behavior.
 */
interface FilterDropdownProps {
  /**
   * Data used for label behavior.
   */
  label?: string;
  /**
   * Data used by options behavior.
   */
  options: Array<{ label: string; value: string }>;
  /**
   * Data used for active option behavior.
   */
  activeOption: string;
  /**
   * Controls visibility state of the related UI region.
   */
  isOpen: boolean;
  /**
   * Callback fired when toggle.
   */
  onToggle: () => void;
  /**
   * Callback fired when select.
   */
  onSelect: (option: string) => void;
  /**
   * Optional utility classes merged into the root element.
   */
  className?: string;
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
 * Renders the filter dropdown interface for shared UI behavior.
 *
 * @param params Input used by filter dropdown.
 * @returns Rendered JSX output.
 */
export default function FilterDropdown({
  label = 'Filter',
  options,
  activeOption,
  isOpen,
  onToggle,
  onSelect,
  className,
}: FilterDropdownProps) {
  return (
    <div className={joinClasses('relative', className)}>
      <button
        onClick={onToggle}
        className="
          flex items-center gap-2 px-4 py-2.5 bg-surface
          border border-neutral-300 rounded-lg text-sm text-secondary
          hover:border-neutral-400 transition-all duration-200 cursor-pointer
        "
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-1 w-36 z-20
            bg-surface border border-neutral-200 rounded-lg
            shadow-lg overflow-hidden
          "
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`
                w-full px-4 py-2.5 text-left text-sm cursor-pointer
                transition-colors duration-150
                ${
                  activeOption === option.value
                    ? 'bg-primary text-text-light font-medium'
                    : 'text-secondary hover:bg-surface-alt'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
