import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import arrowheadLogo from '../../assets/arrowhead-logo.png';
import type { SupplierFormData } from '../../types/supplier';

/**
 * Defines supplier form modal props used by feature UI behavior.
 */
interface SupplierFormModalProps {
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
  onSubmit: (data: SupplierFormData) => void;
  /**
   * Initial state value for data.
   */
  initialData?: Partial<SupplierFormData>;
  /**
   * Data used for is submitting behavior.
   */
  isSubmitting?: boolean;
  /**
   * Error message shown when an operation fails.
   */
  errorMessage?: string | null;
}

/**
 * Renders the supplier form modal interface for feature UI behavior.
 *
 * @param params Input used by supplier form modal.
 * @returns Rendered JSX output.
 */
export default function SupplierFormModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  errorMessage = null,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    serviceCategory: '',
    contactPerson: '',
    contactNumber: '',
    address: '',
  });
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setFormData({
        name: initialData?.name ?? '',
        serviceCategory: initialData?.serviceCategory ?? '',
        contactPerson: initialData?.contactPerson ?? '',
        contactNumber: initialData?.contactNumber ?? '',
        address: initialData?.address ?? '',
      });
      firstInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /**
     * Handles on escape for feature UI behavior.
     *
     * @param event Input consumed by on escape.
     * @returns Computed value for the caller.
     */
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const title = mode === 'add' ? 'Add Supplier' : 'Edit Supplier';
  const submitLabel = mode === 'add' ? 'Create Supplier' : 'Save Changes';
  const submittingLabel = mode === 'add' ? 'Creating...' : 'Saving...';

  const inputClasses = `
    w-full px-4 py-3 bg-white border border-neutral-300 rounded-md
    text-sm text-secondary placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
    transition-all duration-200
  `;

  /**
   * Normalizes a contact number to digits only with an 11-digit cap.
   *
   * @param value Raw contact number input.
   * @returns Sanitized contact number value.
   */
  const normalizeContactNumber = (value: string): string => value.replace(/\D/g, '').slice(0, 11);

  /**
   * Handles handle backdrop click for feature UI behavior.
   *
   * @param event Input consumed by handle backdrop click.
   * @returns Computed value for the caller.
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === backdropRef.current && !isSubmitting) {
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
      name: formData.name.trim(),
      serviceCategory: formData.serviceCategory.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactNumber: formData.contactNumber.trim(),
      address: formData.address.trim(),
    });
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-[2px]
        transition-opacity duration-250 opacity-100
      "
    >
      <div
        className="
          relative w-[92vw] max-w-md bg-surface-alt rounded-2xl
          shadow-modal p-8 sm:p-10
          transition-all duration-300 ease-out opacity-100 translate-y-0 scale-100
        "
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-secondary hover:bg-neutral-200 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-8">
          <img
            src={arrowheadLogo}
            alt="Arrowhead logo"
            className="h-9 w-auto object-contain"
          />
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <input
            ref={firstInputRef}
            type="text"
            name="name"
            placeholder="Supplier Name"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <input
            type="text"
            name="serviceCategory"
            placeholder="Service Category (e.g. Equipment, Nutrition)"
            value={formData.serviceCategory}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, serviceCategory: event.target.value }))
            }
            disabled={isSubmitting}
            className={inputClasses}
          />

          <input
            type="text"
            name="contactPerson"
            placeholder="Contact Person"
            value={formData.contactPerson}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))
            }
            disabled={isSubmitting}
            className={inputClasses}
          />

          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number (e.g. 09171234567)"
            value={formData.contactNumber}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                contactNumber: normalizeContactNumber(event.target.value),
              }))
            }
            maxLength={11}
            pattern="[0-9]{1,11}"
            title="Contact number must be up to 11 digits (e.g. 09171234567)"
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
            disabled={isSubmitting}
            rows={3}
            className={inputClasses}
          />

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
