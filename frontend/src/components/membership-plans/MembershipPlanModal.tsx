import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { MembershipPlanFormData } from '../../types/membershipPlan';
import arrowheadLogo from '../../assets/arrowhead-logo.png';

/**
 * Defines membership plan modal props used by feature UI behavior.
 */
interface MembershipPlanModalProps {
  /**
   * Controls visibility state of the related UI region.
   */
  isOpen: boolean;
  /**
   * Data used for mode behavior.
   */
  mode: 'add' | 'edit';
  /**
   * Callback fired when close.
   */
  onClose: () => void;
  /**
   * Callback fired when submit.
   */
  onSubmit: (data: MembershipPlanFormData) => void;
  /**
   * Initial state value for data.
   */
  initialData?: Partial<MembershipPlanFormData>;
  /**
   * Error message shown when an operation fails.
   */
  errorMessage?: string | null;
}

/**
 * Renders the membership plan modal interface for feature UI behavior.
 *
 * @param params Input used by membership plan modal.
 * @returns Rendered JSX output.
 */
export default function MembershipPlanModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  initialData,
  errorMessage = null,
}: MembershipPlanModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  /* ── Form state ── */
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /* Reset form when modal opens or initialData changes */
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setName(initialData?.name ?? '');
        setDescription(initialData?.description ?? '');
        setPrice(initialData?.price != null ? String(initialData.price) : '');
        setDurationDays(initialData?.durationDays != null ? String(initialData.durationDays) : '');
        setIsActive(initialData?.isActive ?? true);
        setValidationErrors({});
        setIsAnimating(true);
      });
      setTimeout(() => firstInputRef.current?.focus(), 250);
    } else {
      requestAnimationFrame(() => setIsAnimating(false));
    }
  }, [isOpen, initialData]);

  /* Close on Escape */
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
   * Validates membership plan form values before submit.
   *
   * @returns True when all required fields are valid.
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Plan name is required.';
    }

    const parsedPrice = Number(price);
    if (price === '' || isNaN(parsedPrice)) {
      errors.price = 'Price is required.';
    } else if (parsedPrice < 0) {
      errors.price = 'Price must not be negative.';
    }

    const parsedDuration = Number(durationDays);
    if (durationDays === '' || isNaN(parsedDuration)) {
      errors.durationDays = 'Duration is required.';
    } else if (parsedDuration < 1) {
      errors.durationDays = 'Duration must be at least 1 day.';
    } else if (!Number.isInteger(parsedDuration)) {
      errors.durationDays = 'Duration must be a whole number.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handles handle submit for feature UI behavior.
   *
   * @param e Input consumed by handle submit.
   * @returns Computed value for the caller.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      durationDays: Number(durationDays),
      price: Number(price),
      isActive,
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

  /* ── Shared input classes ── */
  const inputClasses = `
    w-full px-4 py-3 bg-white border rounded-md
    text-sm text-secondary placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
    transition-all duration-200
  `;

  const errorInputBorder = 'border-danger';
  const normalInputBorder = 'border-neutral-300';

  return (
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
      <div
        className={`
          relative w-[90vw] max-w-md bg-surface-alt rounded-2xl
          shadow-modal p-8 sm:p-10
          transition-all duration-300 ease-out
          max-h-[90vh] overflow-y-auto
          ${isAnimating
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
          }
        `}
      >
        {/* Close button */}
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

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <img
            src={arrowheadLogo}
            alt="Arrowhead logo"
            className="h-9 w-auto object-contain"
          />
          <h2 className="text-primary text-2xl sm:text-3xl font-semibold tracking-tight">
            {mode === 'add' ? 'Create Plan' : 'Edit Plan'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Plan Name */}
          <div>
            <label htmlFor="plan-name" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Plan Name <span className="text-danger">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="plan-name"
              type="text"
              placeholder="e.g. Monthly Pass"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClasses} ${validationErrors.name ? errorInputBorder : normalInputBorder}`}
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-danger">{validationErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="plan-description" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              id="plan-description"
              placeholder="Brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClasses} ${normalInputBorder} resize-none`}
            />
          </div>

          {/* Price & Duration (side-by-side on larger screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="plan-price" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Price (PHP) <span className="text-danger">*</span>
              </label>
              <input
                id="plan-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClasses} ${validationErrors.price ? errorInputBorder : normalInputBorder}`}
              />
              {validationErrors.price && (
                <p className="mt-1 text-xs text-danger">{validationErrors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="plan-duration" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Duration (Days) <span className="text-danger">*</span>
              </label>
              <input
                id="plan-duration"
                type="number"
                step="1"
                min="1"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className={`${inputClasses} ${validationErrors.durationDays ? errorInputBorder : normalInputBorder}`}
              />
              {validationErrors.durationDays && (
                <p className="mt-1 text-xs text-danger">{validationErrors.durationDays}</p>
              )}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between py-2">
            <label htmlFor="plan-status" className="text-sm font-medium text-secondary">
              Plan Status
            </label>
            <button
              id="plan-status"
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((prev) => !prev)}
              className={`
                relative inline-flex h-7 w-12 shrink-0 rounded-full
                border-2 border-transparent cursor-pointer
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2
                ${isActive ? 'bg-success' : 'bg-neutral-300'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md
                  transform transition-transform duration-200 ease-in-out
                  ${isActive ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
          <p className="text-xs text-neutral-400 -mt-2">
            {isActive ? 'Active — visible to staff during payment processing.' : 'Archived — hidden from payment processing.'}
          </p>

          {/* Submit */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="
                px-10 py-2.5 bg-primary-dark text-text-light text-sm font-semibold
                rounded-full shadow-md shadow-primary/20
                hover:bg-primary hover:shadow-lg hover:shadow-primary/30
                active:scale-[0.97] transition-all duration-200 cursor-pointer
              "
            >
              {mode === 'add' ? 'Create Plan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
