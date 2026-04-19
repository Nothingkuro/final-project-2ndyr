import { useRef, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Defines delete confirm modal props used by shared UI behavior.
 */
interface DeleteConfirmModalProps {
  /**
   * Controls visibility state of the related UI region.
   */
  isOpen: boolean;
  /**
   * Data used for plan name behavior.
   */
  planName?: string;
  /**
   * Data used for item name behavior.
   */
  itemName?: string;
  /**
   * Data used for title behavior.
   */
  title?: string;
  /**
   * Callback fired when confirm.
   */
  onConfirm: () => void;
  /**
   * Callback fired when cancel.
   */
  onCancel: () => void;
}

/**
 * Renders the delete confirm modal interface for shared UI behavior.
 *
 * @param params Input used by delete confirm modal.
 * @returns Rendered JSX output.
 */
export default function DeleteConfirmModal({
  isOpen,
  planName,
  itemName,
  title,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      requestAnimationFrame(() => setIsAnimating(false));
    }
  }, [isOpen]);

  useEffect(() => {
    /**
     * Handles handle key for shared UI behavior.
     *
     * @param e Input consumed by handle key.
     * @returns Computed value for the caller.
     */
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  /**
   * Handles handle backdrop click for shared UI behavior.
   *
   * @param e Input consumed by handle backdrop click.
   * @returns Computed value for the caller.
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onCancel();
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
          relative w-[90vw] max-w-sm bg-surface rounded-2xl
          shadow-modal p-8 text-center
          transition-all duration-300 ease-out
          ${isAnimating
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
          }
        `}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle size={24} className="text-danger" />
        </div>

        <h3 className="text-lg font-semibold text-secondary mb-2">
          {planName ? 'Delete Plan' : (title || 'Delete Item')}
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-secondary">"{planName || itemName}"</span>?
          This action cannot be undone.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              px-5 py-2 rounded-full border border-neutral-300 text-sm font-semibold
              text-secondary hover:bg-neutral-100
              transition-all duration-200 cursor-pointer
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              px-5 py-2 rounded-full bg-danger text-text-light text-sm font-semibold
              shadow-md shadow-danger/25
              hover:bg-red-600 active:scale-[0.97]
              transition-all duration-200 cursor-pointer
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
