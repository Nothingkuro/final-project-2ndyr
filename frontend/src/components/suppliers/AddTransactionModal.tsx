import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import arrowheadLogo from '../../assets/arrowhead-logo.png';
import type { TransactionFormData } from '../../types/supplier';

interface AddTransactionModalProps {
  isOpen: boolean;
  supplierName: string;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionFormData, 'supplierId'>) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

interface TransactionFormState {
  itemsPurchased: string;
  totalCost: string;
}

export default function AddTransactionModal({
  isOpen,
  supplierName,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormState>({
    itemsPurchased: '',
    totalCost: '',
  });
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setFormData({ itemsPurchased: '', totalCost: '' });
      firstInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  const inputClasses = `
    w-full px-4 py-3 bg-white border border-neutral-300 rounded-md
    text-sm text-secondary placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
    transition-all duration-200
  `;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === backdropRef.current && !isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedCost = Number(formData.totalCost);

    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      return;
    }

    onSubmit({
      itemsPurchased: formData.itemsPurchased.trim(),
      totalCost: parsedCost,
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
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
            Add Transaction
          </h2>
        </div>

        <p className="mb-5 text-sm text-neutral-600">
          Supplier: <span className="font-semibold text-secondary">{supplierName}</span>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <input
            ref={firstInputRef}
            type="text"
            name="itemsPurchased"
            placeholder="Items Purchased"
            value={formData.itemsPurchased}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, itemsPurchased: event.target.value }))
            }
            disabled={isSubmitting}
            required
            className={inputClasses}
          />

          <input
            type="number"
            name="totalCost"
            placeholder="Total Cost"
            min="0"
            step="0.01"
            value={formData.totalCost}
            onChange={(event) => setFormData((prev) => ({ ...prev, totalCost: event.target.value }))}
            disabled={isSubmitting}
            required
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
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
