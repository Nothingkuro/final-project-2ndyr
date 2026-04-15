import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { MembershipPlan, MembershipPlanFormData } from '../types/membershipPlan';
import MembershipPlanTable from '../components/membership-plans/MembershipPlanTable';
import MembershipPlanModal from '../components/membership-plans/MembershipPlanModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import {
  createMembershipPlan,
  deleteMembershipPlan,
  listMembershipPlans,
  updateMembershipPlan,
} from '../services/membershipPlanApi';

interface MembershipPlansPageProps {
  plans?: MembershipPlan[];
  initialLoading?: boolean;
}

export default function MembershipPlansPage({
  plans: providedPlans,
  initialLoading = false,
}: MembershipPlansPageProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>(providedPlans ?? []);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [pageError, setPageError] = useState<string | null>(null);

  /* ── Modal state ── */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activePlan, setActivePlan] = useState<MembershipPlan | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ── Delete confirmation state ── */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);

  const isLocalMode = providedPlans !== undefined;

  useEffect(() => {
    if (!providedPlans) {
      return;
    }

    setPlans(providedPlans);
    setIsLoading(false);
    setPageError(null);
  }, [providedPlans]);

  useEffect(() => {
    if (isLocalMode) {
      return;
    }

    let cancelled = false;

    const loadPlans = async () => {
      try {
        setIsLoading(true);
        setPageError(null);

        const fetchedPlans = await listMembershipPlans(true);

        if (!cancelled) {
          setPlans(fetchedPlans);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load membership plans';
          setPageError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, [isLocalMode]);

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

  const handleSubmit = async (data: MembershipPlanFormData) => {
    try {
      setModalError(null);
      setPageError(null);

      if (isLocalMode) {
        const now = new Date().toISOString();

        if (modalMode === 'add') {
          const localPlan: MembershipPlan = {
            id: `story-${Date.now()}`,
            name: data.name,
            description: data.description || null,
            durationDays: data.durationDays,
            price: data.price,
            isActive: data.isActive,
            createdAt: now,
            updatedAt: now,
          };

          setPlans((prev) => [...prev, localPlan]);
        } else if (activePlan) {
          setPlans((prev) =>
            prev.map((plan) =>
              plan.id === activePlan.id
                ? {
                  ...plan,
                  name: data.name,
                  description: data.description || null,
                  durationDays: data.durationDays,
                  price: data.price,
                  isActive: data.isActive,
                  updatedAt: now,
                }
                : plan,
            ),
          );
        }

        setIsModalOpen(false);
        return;
      }

      if (modalMode === 'add') {
        const createdPlan = await createMembershipPlan(data);
        setPlans((prev) => [...prev, createdPlan]);
      } else if (activePlan) {
        const updatedPlan = await updateMembershipPlan(activePlan.id, data);
        setPlans((prev) => prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
      }

      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save membership plan';
      setModalError(message);
    }
  };

  const handleRequestDelete = (plan: MembershipPlan) => {
    setPlanToDelete(plan);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) {
      return;
    }

    try {
      setPageError(null);

      if (!isLocalMode) {
        await deleteMembershipPlan(planToDelete.id);
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== planToDelete.id));
      setIsDeleteOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete membership plan';
      setPageError(message);
      setIsDeleteOpen(false);
      setPlanToDelete(null);
    }
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
        {isLoading && (
          <div className="mb-3 text-sm text-neutral-500">Loading membership plans...</div>
        )}

        {pageError && (
          <div className="mb-3 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
            {pageError}
          </div>
        )}

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
          disabled={isLoading}
          className="
            flex items-center gap-2 px-5 py-3 bg-primary text-text-light
            rounded-full shadow-lg shadow-primary/30
            hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40
            disabled:opacity-60 disabled:cursor-not-allowed
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
