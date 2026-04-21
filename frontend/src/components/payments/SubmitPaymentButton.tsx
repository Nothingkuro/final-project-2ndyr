/**
 * Defines submit payment button props used by feature UI behavior.
 */
interface SubmitPaymentButtonProps {
  /**
   * Callback fired when click.
   */
  onClick?: () => void;
  /**
   * Disables user interaction when true.
   */
  disabled?: boolean;
  /**
   * Data used for label behavior.
   */
  label?: string;
  /**
   * Marks whether the button is currently in undo mode.
   */
  isUndo?: boolean;
  /**
   * Optional payment reference used by submit payload flows.
   */
  referenceNumber?: string;
}

/**
 * Renders the submit payment button interface for feature UI behavior.
 *
 * @param params Input used by submit payment button.
 * @returns Rendered JSX output.
 */
export default function SubmitPaymentButton({
  onClick,
  disabled = false,
  label = 'Submit',
  isUndo = false,
  referenceNumber = '',
}: SubmitPaymentButtonProps) {
  const themeClasses = isUndo
    ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600 hover:shadow-red-500/30'
    : 'bg-primary-dark shadow-primary/20 hover:bg-primary hover:shadow-primary/30';

  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        data-undo={isUndo ? 'true' : 'false'}
        data-reference-number={referenceNumber}
        className={`
          px-10 py-2.5 text-text-light text-sm font-semibold
          rounded-full shadow-md
          active:scale-[0.97] transition-all duration-200 cursor-pointer
          disabled:cursor-not-allowed disabled:opacity-70
          ${themeClasses}
        `}
      >
        {label}
      </button>
    </div>
  );
}
