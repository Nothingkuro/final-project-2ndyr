import { useEffect, useState } from 'react';
import MemberSearchSelect from '../components/payments/MemberSearchSelect';
import MembershipPlanTable from '../components/payments/MembershipPlanTable';
import PaymentMethodDropdown from '../components/payments/PaymentMethodDropdown';
import SubmitPaymentButton from '../components/payments/SubmitPaymentButton';
import useUndoTimer from '../hooks/useUndoTimer';
import { getAuthHeaders } from '../services/authHeaders';
import { API_BASE_URL } from '../services/apiBaseUrl';
import type {
  CreatePaymentRequest,
  MembershipPlan,
  PaymentMember,
  PaymentMethod,
} from '../types/payment';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'GCASH'];

/**
 * Type alias for api members response in route-level dashboard orchestration.
 */
type ApiMembersResponse = {
  items: Array<{
    id: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    status: PaymentMember['status'];
  }>;
};

/**
 * Type alias for api plan in route-level dashboard orchestration.
 */
type ApiPlan = {
  id: string;
  name: string;
  durationDays: number;
  description?: string | null;
  price: number | string;
};

type CreatePaymentResponse = {
  payment: {
    id: string;
  };
  error?: string;
};

/**
 * Handles find preferred monthly plan id logic for page-level dashboard orchestration.
 *
 * @param plans Input used by find preferred monthly plan id.
 * @returns Computed value for the caller.
 */
function findPreferredMonthlyPlanId(plans: MembershipPlan[]): string | null {
  const monthlyPlan = plans.find((plan) => plan.durationDays >= 28 && plan.durationDays <= 31);
  return monthlyPlan?.id ?? null;
}

/**
 * Handles parse api response logic for page-level dashboard orchestration.
 *
 * @param response Input used by parse api response.
 * @returns A promise that resolves when processing is complete.
 */
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

/**
 * Defines payments page props used by route-level dashboard orchestration.
 */
interface PaymentsPageProps {
  /**
   * Collection data rendered by members UI.
   */
  members?: PaymentMember[];
  /**
   * Collection data rendered by plans UI.
   */
  plans?: MembershipPlan[];
  /**
   * Initial state value for selected member id.
   */
  initialSelectedMemberId?: string;
  /**
   * Initial state value for payment method.
   */
  initialPaymentMethod?: PaymentMethod;
  /**
   * Initial state value for selected plan id.
   */
  initialSelectedPlanId?: string;
  /**
   * Marks whether asynchronous data is currently loading.
   */
  initialLoading?: boolean;
}

/**
 * Renders the payments page interface for page-level dashboard orchestration.
 *
 * @param params Input used by payments page.
 * @returns Rendered JSX output.
 */
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
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialSelectedPlanId);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const {
    isUndoAvailable,
    activeId: undoPaymentId,
    startUndoWindow,
    clearUndoState,
  } = useUndoTimer(5000);

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

    /**
     * Handles load payments context for route-level dashboard orchestration.
     * @returns A promise that resolves when processing completes.
     */
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

  useEffect(() => {
    if (selectedPaymentMethod !== 'GCASH' && referenceNumber !== '') {
      setReferenceNumber('');
    }
  }, [referenceNumber, selectedPaymentMethod]);

  /**
   * Handles handle submit payment for route-level dashboard orchestration.
   * @returns A promise that resolves when processing completes.
   */
  const handleSubmitPayment = async () => {
    if (isSubmitting || isLoading) {
      return;
    }

    if (isUndoAvailable && undoPaymentId) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        const undoResponse = await fetch(`${API_BASE_URL}/api/payments/${undoPaymentId}/undo`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            ...getAuthHeaders(),
          },
        });

        const undoData = (await parseApiResponse(undoResponse)) as { error?: string };

        if (!undoResponse.ok) {
          const message = typeof undoData.error === 'string' ? undoData.error : 'Failed to undo payment';
          throw new Error(message);
        }

        clearUndoState();
        setSubmitSuccess('Payment successfully undone.');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to undo payment';
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!selectedMemberId || !selectedPlanId) {
      return;
    }

    const selectedPlan = plansList.find((plan) => plan.id === selectedPlanId);

    if (!selectedPlan) {
      setSubmitError('Please select a valid membership plan.');
      return;
    }

    if (selectedPaymentMethod === 'GCASH' && referenceNumber.trim().length < 8) {
      setSubmitError('GCash reference number must be at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const paymentPayload: CreatePaymentRequest = {
        memberId: selectedMemberId,
        planId: selectedPlanId,
        paymentMethod: selectedPaymentMethod,
        amountPaid: selectedPlan.price,
        referenceNumber: selectedPaymentMethod === 'GCASH' ? referenceNumber.trim() : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(paymentPayload),
      });

      const data = (await parseApiResponse(response)) as CreatePaymentResponse;

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to submit payment';
        throw new Error(message);
      }

      startUndoWindow(data.payment.id);
      setSubmitSuccess('Payment recorded successfully. Undo is available for 5 seconds.');
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
    || (
      !isUndoAvailable
      && (
        membersList.length === 0
        || plansList.length === 0
        || !selectedMemberId
        || !selectedPlanId
        || (selectedPaymentMethod === 'GCASH' && referenceNumber.trim().length < 8)
      )
    )
    || (isUndoAvailable && !undoPaymentId);

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

          {selectedPaymentMethod === 'GCASH' && (
            <div className="space-y-2">
              <label htmlFor="gcashReferenceNumber" className="block text-sm font-medium text-text-primary">
                GCash Reference Number
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Required
                </span>
              </label>
              <input
                id="gcashReferenceNumber"
                type="text"
                value={referenceNumber}
                onChange={(event) => {
                  setReferenceNumber(event.target.value);
                }}
                placeholder="Enter GCash reference number"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoComplete="off"
              />
            </div>
          )}

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
            label={isSubmitting ? 'Submitting...' : isUndoAvailable ? 'Undo Action' : 'Submit'}
            isUndo={isUndoAvailable}
            referenceNumber={referenceNumber}
          />
        </div>
      </section>
    </div>
  );
}
