/**
 * Type alias for action variant in shared UI behavior.
 */
export type ActionVariant = 'secondary' | 'neutral' | 'danger';

/**
 * Defines action group item used by shared UI behavior.
 */
export interface ActionGroupItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: ActionVariant;
}

/**
 * Defines action group props used by shared UI behavior.
 */
interface ActionGroupProps {
  /**
   * Data used for actions behavior.
   */
  actions: ActionGroupItem[];
  /**
   * Optional utility classes merged into the root element.
   */
  className?: string;
}

/**
 * Handles variant classes for shared UI behavior.
 *
 * @param variant Input consumed by variant classes.
 * @param disabled Input consumed by variant classes.
 * @returns Computed value for the caller.
 */
function variantClasses(variant: ActionVariant, disabled: boolean) {
  if (disabled) {
    return 'border-neutral-200 text-neutral-300 bg-neutral-50 cursor-not-allowed';
  }

  switch (variant) {
    case 'secondary':
      return 'border-secondary text-secondary bg-transparent hover:bg-secondary hover:text-text-light cursor-pointer';
    case 'danger':
      return 'border-danger text-danger bg-transparent hover:bg-danger hover:text-text-light cursor-pointer';
    case 'neutral':
    default:
      return 'border-neutral-400 text-neutral-600 bg-transparent hover:bg-neutral-100 cursor-pointer';
  }
}

/**
 * Renders the action group view for shared UI behavior.
 *
 * @param params Input consumed by action group.
 * @returns Rendered JSX content.
 */
export default function ActionGroup({ actions, className }: ActionGroupProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className ?? ''}`}>
      {actions.map((action) => {
        const variant = action.variant ?? 'neutral';
        const disabled = action.disabled ?? false;

        return (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={disabled}
            className={`
              px-6 py-2 border-2 rounded-lg text-sm font-semibold
              active:scale-[0.97] transition-all duration-200
              ${variantClasses(variant, disabled)}
            `}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
