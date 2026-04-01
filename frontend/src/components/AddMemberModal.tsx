import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import arrowheadLogo from '../assets/arrowhead-logo.png';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

export interface MemberFormData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  notes: string;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onSubmit,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    notes: '',
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM renders before we trigger the CSS transition
      requestAnimationFrame(() => setIsAnimating(true));
      // Focus the first field after the entrance animation
      setTimeout(() => firstInputRef.current?.focus(), 250);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ firstName: '', lastName: '', contactNumber: '', notes: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
            Add Member
          </h2>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={firstInputRef}
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={inputClasses}
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={inputClasses}
          />

          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            className={inputClasses}
          />

          <input
            type="text"
            name="notes"
            placeholder="Notes"
            value={formData.notes}
            onChange={handleChange}
            className={inputClasses}
          />

          {/* ── Submit Button ── */}
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
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
