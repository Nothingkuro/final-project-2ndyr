import { useEffect, useState } from 'react';
import MemberSearchSelect from '../components/payments/MemberSearchSelect';
import MembershipPlanTable from '../components/payments/MembershipPlanTable';
import PaymentMethodDropdown from '../components/payments/PaymentMethodDropdown';
import SubmitPaymentButton from '../components/payments/SubmitPaymentButton';
import { getAuthHeaders } from '../services/authHeaders';
import { API_BASE_URL } from '../services/apiBaseUrl';
import type { MembershipPlan, PaymentMember, PaymentMethod } from '../types/payment';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'GCASH'];

type ApiMembersResponse = {
  items: Array<{
    id: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    status: PaymentMember['status'];
  }>;
};

type ApiPlan = {
  id: string;
  name: string;
  durationDays: number;
  description?: string | null;
  price: number | string;
};

function findPreferredMonthlyPlanId(plans: MembershipPlan[]): string | null {
  const monthlyPlan = plans.find((plan) => plan.durationDays >= 28 && plan.durationDays <= 31);
  return monthlyPlan?.id ?? null;
}

async function parseApiResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const textBody = await response.text();

  throw new Error(
    textBody.trim().startsWith('<')
      ? 'Server returned HTML instead of JSON. Check VITE_API_BASE_URL and backend API route configuration.'
      : 'Server returned an unexpected response format.',
  );
}

interface PaymentsPageProps {
  members?: PaymentMember[];
  plans?: MembershipPlan[];
  initialSelectedMemberId?: string;
  initialPaymentMethod?: PaymentMethod;
  initialSelectedPlanId?: string;
  initialLoading?: boolean;
}

export default function PaymentsPage({
  members,
  plans,
  initialSelectedMemberId = '',
  initialPaymentMethod = 'CASH',
  initialSelectedPlanId = '',
  initialLoading = false,
}: PaymentsPageProps) {
  const [membersList, setMembersList] = useState<PaymentMember[]>(members ?? []);
  const [plansList, setPlansList] = useState<MembershipPlan[]>(plans ?? []);
  const [selectedMemberId, setSelectedMemberId] = useState(initialSelectedMemberId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(initialPaymentMethod);
  const [selectedPlanId, setSelectedPlanId] = useState(initialSelectedPlanId);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (members) {
      setMembersList(members);
    }
  }, [members]);

  useEffect(() => {
    if (plans) {
      setPlansList(plans);
    }
  }, [plans]);

  useEffect(() => {
    if (members && plans) {
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadPaymentsContext = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [resolvedMembers, resolvedPlans] = await Promise.all([
          members
            ? Promise.resolve(members)
            : (async () => {
                const params = new URLSearchParams({
                  page: '1',
                  pageSize: '100',
                });

                const response = await fetch(`${API_BASE_URL}/api/members?${params.toString()}`, {
                  method: 'GET',
                  headers: {
                    ...getAuthHeaders(),
                  },
                  credentials: 'include',
                  signal: controller.signal,
                });

                const data = (await parseApiResponse(response)) as ApiMembersResponse | { error?: string };

                if (!response.ok) {
                  const message = 'error' in data && typeof data.error === 'string'
                    ? data.error
                    : 'Failed to load members';
                  throw new Error(message);
                }

                return (data as ApiMembersResponse).items;
              })(),
          plans
            ? Promise.resolve(plans)
            : (async () => {
                const response = await fetch(`${API_BASE_URL}/api/plans`, {
                  method: 'GET',
                  headers: {
                    ...getAuthHeaders(),
                  },
                  credentials: 'include',
                  signal: controller.signal,
                });

                const data = (await parseApiResponse(response)) as ApiPlan[] | { error?: string };

                if (!response.ok) {
                  const message = 'error' in data && typeof data.error === 'string'
                    ? data.error
                    : 'Failed to load membership plans';
                  throw new Error(message);
                }

                return (data as ApiPlan[]).map((plan) => ({
                  id: plan.id,
                  name: plan.name,
                  durationDays: plan.durationDays,
                  description: plan.description ?? undefined,
                  price: Number(plan.price),
                }));
              })(),
        ]);

        setMembersList(resolvedMembers);
        setPlansList(resolvedPlans);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load payment data';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPaymentsContext();

    return () => {
      controller.abort();
    };
  }, [members, plans]);

  useEffect(() => {
    if (!selectedMemberId) {
      return;
    }

    if (membersList.some((member) => member.id === selectedMemberId)) {
      return;
    }

    setSelectedMemberId('');
  }, [membersList, selectedMemberId]);

  useEffect(() => {
    if (selectedPlanId && plansList.some((plan) => plan.id === selectedPlanId)) {
      return;
    }

    if (plansList.length === 0) {
      setSelectedPlanId('');
      return;
    }

    const preferredMonthlyPlanId = findPreferredMonthlyPlanId(plansList);
    setSelectedPlanId(preferredMonthlyPlanId ?? plansList[0].id);
  }, [plansList, selectedPlanId]);

  useEffect(() => {
    setIsLoading(initialLoading);
  }, [initialLoading]);

  useEffect(() => {
    setSelectedPaymentMethod(initialPaymentMethod);
  }, [initialPaymentMethod]);

  const handleSubmitPayment = async () => {
    if (!selectedMemberId || !selectedPlanId || isSubmitting || isLoading) {
      return;
    }

    const selectedPlan = plansList.find((plan) => plan.id === selectedPlanId);

    if (!selectedPlan) {
      setSubmitError('Please select a valid membership plan.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          memberId: selectedMemberId,
          planId: selectedPlanId,
          paymentMethod: selectedPaymentMethod,
          amountPaid: selectedPlan.price,
        }),
      });

      const data = (await parseApiResponse(response)) as { error?: string };

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to submit payment';
        throw new Error(message);
      }

      setSubmitSuccess('Payment recorded successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit payment';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isLoading
    || isSubmitting
    || membersList.length === 0
    || plansList.length === 0
    || !selectedMemberId
    || !selectedPlanId;

  return (
    <div className="relative min-h-full">
      <div className="flex items-center justify-center gap-2.5">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold tracking-tight">Process Payment</h1>
      </div>

      <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-neutral-300 bg-surface-alt px-6 py-6 shadow-card sm:px-8 sm:py-8">
        <div className="space-y-6">
          <MemberSearchSelect
            members={membersList}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            disabled={isLoading || membersList.length === 0}
          />

          <PaymentMethodDropdown
            value={selectedPaymentMethod}
            onChange={setSelectedPaymentMethod}
            disabled={isLoading}
            methods={PAYMENT_METHODS}
          />

          <MembershipPlanTable
            plans={plansList}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            isLoading={isLoading}
          />

          {loadError && (
            <p className="text-sm text-red-600">{loadError}</p>
          )}

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          {submitSuccess && (
            <p className="text-sm text-green-700">{submitSuccess}</p>
          )}

          <SubmitPaymentButton
            onClick={handleSubmitPayment}
            disabled={isSubmitDisabled}
            label={isSubmitting ? 'Submitting...' : 'Submit'}
          />
        </div>
      </section>
    </div>
  );
}
