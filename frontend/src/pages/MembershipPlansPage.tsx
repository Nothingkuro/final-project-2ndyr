import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { MembershipPlan, MembershipPlanFormData } from '../types/membershipPlan';
import MembershipPlanTable from '../components/membership-plans/MembershipPlanTable';
import MembershipPlanModal from '../components/membership-plans/MembershipPlanModal';
import DeleteConfirmModal from '../components/membership-plans/DeleteConfirmModal';

/* ── Mock data ── */
const MOCK_PLANS: MembershipPlan[] = [
  {
    id: '1',
    name: 'Monthly Pass',
    description: 'Standard monthly gym access',
    durationDays: 30,
    price: 1000,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: 'Quarterly Pass',
    description: '3-month gym access at a discounted rate',
    durationDays: 90,
    price: 2500,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: '3',
    name: '6-Month VIP',
    description: 'Half-year VIP membership with locker access',
    durationDays: 180,
    price: 4500,
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: '4',
    name: 'Annual Pass',
    description: 'Full-year unlimited gym access — best value',
    durationDays: 365,
    price: 10000,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: '5',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: '6',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: '7',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: '8',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: '9',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: '10',
    name: 'Day Pass',
    description: 'Single day walk-in access',
    durationDays: 1,
    price: 100,
    isActive: false,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-20T08:00:00Z',
  },

];

let nextId = 6;

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>(MOCK_PLANS);

  /* ── Modal state ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activePlan, setActivePlan] = useState<MembershipPlan | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ── Delete confirmation state ── */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);

  /* ── Handlers ── */
  const handleOpenAdd = () => {
    setModalMode('add');
    setActivePlan(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setModalMode('edit');
    setActivePlan(plan);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleSubmit = (data: MembershipPlanFormData) => {
    const now = new Date().toISOString();

    if (modalMode === 'add') {
      const newPlan: MembershipPlan = {
        id: String(nextId++),
        name: data.name,
        description: data.description || null,
        durationDays: data.durationDays,
        price: data.price,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };
      setPlans((prev) => [...prev, newPlan]);
    } else if (activePlan) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === activePlan.id
            ? {
              ...p,
              name: data.name,
              description: data.description || null,
              durationDays: data.durationDays,
              price: data.price,
              isActive: data.isActive,
              updatedAt: now,
            }
            : p,
        ),
      );
    }

    setIsModalOpen(false);
  };

  const handleRequestDelete = (plan: MembershipPlan) => {
    setPlanToDelete(plan);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (planToDelete) {
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
    }
    setIsDeleteOpen(false);
    setPlanToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setPlanToDelete(null);
  };

  /* ── Derived stats ── */
  const activePlansCount = plans.filter((p) => p.isActive).length;
  const archivedPlansCount = plans.length - activePlansCount;

  return (
    <div className="flex flex-col h-full">
      {/* ── Page Header ── */}
      <div className="shrink-0 flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">
          Membership Plans
        </h1>
      </div>

      {/* ── Stats Cards ── */}
      <div className="shrink-0 mx-auto w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-neutral-200 rounded-xl px-5 py-4 shadow-card">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Total Plans
          </p>
          <p className="text-2xl font-bold text-secondary mt-1">{plans.length}</p>
        </div>
        <div className="bg-surface border border-neutral-200 rounded-xl px-5 py-4 shadow-card">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Active
          </p>
          <p className="text-2xl font-bold text-success mt-1">{activePlansCount}</p>
        </div>
        <div className="bg-surface border border-neutral-200 rounded-xl px-5 py-4 shadow-card">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Archived
          </p>
          <p className="text-2xl font-bold text-neutral-400 mt-1">{archivedPlansCount}</p>
        </div>
      </div>



      {/* ── Table ── */}
      <div className="mx-auto w-full max-w-5xl flex-1 min-h-0">
        <MembershipPlanTable
          plans={plans}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      </div>

      {/* ── Add Plan FAB ── */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-20">
        <button
          onClick={handleOpenAdd}
          className="
            flex items-center gap-2 px-5 py-3 bg-primary text-text-light
            rounded-full shadow-lg shadow-primary/30
            hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40
            active:scale-95 transition-all duration-200 cursor-pointer
            text-sm font-semibold
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Plan</span>
        </button>
      </div>

      {/* ── Modals ── */}
      <MembershipPlanModal
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={
          activePlan
            ? {
              name: activePlan.name,
              description: activePlan.description ?? '',
              durationDays: activePlan.durationDays,
              price: activePlan.price,
              isActive: activePlan.isActive,
            }
            : undefined
        }
        errorMessage={modalError}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        planName={planToDelete?.name ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
