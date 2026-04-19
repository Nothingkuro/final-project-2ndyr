import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import arrowheadLogo from '../../assets/arrowhead-logo.png';
import { EquipmentCondition } from '../../types/equipment';

/**
 * Defines add equipment modal props used by feature UI behavior.
 */
interface AddEquipmentModalProps {
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
  onSubmit: (data: EquipmentFormData) => void;
  /**
   * Initial state value for data.
   */
  initialData?: Partial<EquipmentFormData>;
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
  /**
   * Data used for condition only edit behavior.
   */
  conditionOnlyEdit?: boolean;
}

/**
 * Defines equipment form data used by feature UI behavior.
 */
export interface EquipmentFormData {
  itemName: string;
  quantity: number;
  condition: EquipmentCondition;
}

const conditionOptions: Array<{ label: string; value: EquipmentCondition }> = [
  { label: 'Good', value: EquipmentCondition.GOOD },
  { label: 'Maintenance', value: EquipmentCondition.MAINTENANCE },
  { label: 'Broken', value: EquipmentCondition.BROKEN },
];

/**
 * Renders the add equipment modal interface for feature UI behavior.
 *
 * @param params Input used by add equipment modal.
 * @returns Rendered JSX output.
 */
export default function AddEquipmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  errorMessage = null,
  title = 'Add Equipment',
  submitLabel = 'Submit',
  submittingLabel = 'Submitting...',
  conditionOnlyEdit = false,
}: AddEquipmentModalProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    itemName: '',
    quantity: 1,
    condition: EquipmentCondition.GOOD,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const conditionSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
      setTimeout(() => {
        if (conditionOnlyEdit) {
          conditionSelectRef.current?.focus();
          return;
        }

        firstInputRef.current?.focus();
      }, 250);
    }
  }, [isOpen, conditionOnlyEdit]);

  useEffect(() => {
    /**
     * Handles handle key down for feature UI behavior.
     *
     * @param event Input consumed by handle key down.
     * @returns Computed value for the caller.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setFormData({
        itemName: initialData?.itemName ?? '',
        quantity: initialData?.quantity ?? 1,
        condition: initialData?.condition ?? EquipmentCondition.GOOD,
      });
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [initialData, isOpen]);

  if (!isOpen) {
    return null;
  }

  const inputClasses = `
    w-full px-4 py-3 bg-white border border-neutral-300 rounded-md
    text-sm text-secondary placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
    transition-all duration-200
  `;

  /**
   * Handles handle backdrop click for feature UI behavior.
   *
   * @param event Input consumed by handle backdrop click.
   * @returns Computed value for the caller.
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === backdropRef.current) {
      onClose();
    }
  };

  /**
   * Handles handle submit for feature UI behavior.
   *
   * @param event Input consumed by handle submit.
   * @returns Computed value for the caller.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    onSubmit({
      ...formData,
      quantity: Number.isFinite(formData.quantity) ? Math.max(0, formData.quantity) : 0,
    });
  };

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
          ${
            isAnimating
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-6 scale-95'
          }
        `}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-secondary hover:bg-neutral-200 transition-colors duration-150 cursor-pointer"
        >
          <X size={18} />
        </button>

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {conditionOnlyEdit && (
            <div className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
              Staff can only update equipment condition.
            </div>
          )}

          <input
            ref={firstInputRef}
            type="text"
            name="itemName"
            placeholder="Equipment Name"
            value={formData.itemName}
            onChange={(event) => setFormData((prev) => ({ ...prev, itemName: event.target.value }))}
            disabled={isSubmitting || conditionOnlyEdit}
            required
            className={inputClasses}
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            min={0}
            step={1}
            value={formData.quantity}
            onChange={(event) => setFormData((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
            disabled={isSubmitting || conditionOnlyEdit}
            required
            className={inputClasses}
          />

          <select
            ref={conditionSelectRef}
            name="condition"
            value={formData.condition}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                condition: event.target.value as EquipmentCondition,
              }))
            }
            disabled={isSubmitting}
            className={`${inputClasses} cursor-pointer`}
          >
            {conditionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

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
