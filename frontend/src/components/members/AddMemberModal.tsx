import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import arrowheadLogo from '../../assets/arrowhead-logo.png';

/**
 * Defines member form modal props used by feature UI behavior.
 */
interface MemberFormModalProps {
  /**
   * Controls visibility state of the related UI region.
   */
  isOpen: boolean;
  /**
   * Callback fired when close.
   */
  onClose: () => void;
  /**
   * Callback fired when submit.
   */
  onSubmit: (data: MemberFormData) => void;
  /**
   * Initial state value for data.
   */
  initialData?: Partial<MemberFormData>;
  /**
   * Data used for is submitting behavior.
   */
  isSubmitting?: boolean;
  /**
   * Error message shown when an operation fails.
   */
  errorMessage?: string | null;
  /**
   * Data used for title behavior.
   */
  title?: string;
  /**
   * Data used for submit label behavior.
   */
  submitLabel?: string;
  /**
   * Data used for submitting label behavior.
   */
  submittingLabel?: string;
}

/**
 * Defines member form data used by feature UI behavior.
 */
export interface MemberFormData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  notes: string;
}

/**
 * Renders the member form modal interface for feature UI behavior.
 *
 * @param params Input used by member form modal.
 * @returns Rendered JSX output.
 */
export default function MemberFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  errorMessage = null,
  title = 'Add Member',
  submitLabel = 'Submit',
  submittingLabel = 'Submitting...',
}: MemberFormModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formResetKey = useMemo(
    () =>
      [
        initialData?.firstName ?? '',
        initialData?.lastName ?? '',
        initialData?.contactNumber ?? '',
        initialData?.notes ?? '',
      ].join('|'),
    [initialData?.firstName, initialData?.lastName, initialData?.contactNumber, initialData?.notes],
  );

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM renders before we trigger the CSS transition
      requestAnimationFrame(() => setIsAnimating(true));
      // Focus the first field after the entrance animation
      setTimeout(() => firstInputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    /**
     * Handles handle key for feature UI behavior.
     *
     * @param e Input consumed by handle key.
     * @returns Computed value for the caller.
     */
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /**
   * Handles handle submit for feature UI behavior.
   *
   * @param e Input consumed by handle submit.
   * @returns Computed value for the caller.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const form = new FormData(e.currentTarget as HTMLFormElement);
    onSubmit({
      firstName: String(form.get('firstName') ?? '').trim(),
      lastName: String(form.get('lastName') ?? '').trim(),
      contactNumber: String(form.get('contactNumber') ?? '').trim(),
      notes: String(form.get('notes') ?? '').trim(),
    });
  };

  /**
   * Handles handle backdrop click for feature UI behavior.
   *
   * @param e Input consumed by handle backdrop click.
   * @returns Computed value for the caller.
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  /* ── shared input classes ── */
  const inputClasses = `
    w-full px-4 py-3 bg-white border border-neutral-300 rounded-md
    text-sm text-secondary placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
    transition-all duration-200
  `;

  return (
    /* ── Backdrop ── */
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-[2px]
        transition-opacity duration-250
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* ── Modal Card ── */}
      <div
        className={`
          relative w-[90vw] max-w-md bg-surface-alt rounded-2xl
          shadow-modal p-8 sm:p-10
          transition-all duration-300 ease-out
          ${isAnimating
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
          }
        `}
      >
        {/* Close button (top‑right) */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="
            absolute top-4 right-4 p-1.5 rounded-full
            text-neutral-400 hover:text-secondary hover:bg-neutral-200
            transition-colors duration-150 cursor-pointer
          "
        >
          <X size={18} />
        </button>

        {/* ── Header: Logo + Title ── */}
        <div className="flex items-center gap-2.5 mb-8">
          <img
            src={arrowheadLogo}
            alt="Arrowhead logo"
            className="h-9 w-auto object-contain"
          />
          <h2 className="text-primary text-2xl sm:text-3xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>

        {/* ── Form ── */}
        <form key={formResetKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <input
            ref={firstInputRef}
            type="text"
            name="firstName"
            placeholder="First Name"
            defaultValue={initialData?.firstName ?? ''}
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            defaultValue={initialData?.lastName ?? ''}
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number"
            defaultValue={initialData?.contactNumber ?? ''}
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <textarea
            name="notes"
            placeholder="Notes"
            defaultValue={initialData?.notes ?? ''}
            disabled={isSubmitting}
            rows={3}
            className={inputClasses}
          />

          {/* ── Submit Button ── */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                px-10 py-2.5 bg-primary-dark text-text-light text-sm font-semibold
                rounded-full shadow-md shadow-primary/20
                hover:bg-primary hover:shadow-lg hover:shadow-primary/30
                active:scale-[0.97] transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-70
              "
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
