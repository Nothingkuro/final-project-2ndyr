import { useEffect, useMemo, useState } from 'react';
import PaymentHistoryFilters from './PaymentHistoryFilters';
import PaymentHistoryList from './PaymentHistoryList';
import type { MemberPaymentHistoryRecord } from '../../../types/payment';
import { API_BASE_URL } from '../../../services/apiBaseUrl';

interface MemberPaymentHistoryPanelProps {
  memberId: string;
  payments?: MemberPaymentHistoryRecord[];
}

export default function MemberPaymentHistoryPanel({
  memberId,
  payments,
}: MemberPaymentHistoryPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [apiPayments, setApiPayments] = useState<MemberPaymentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(payments === undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (payments !== undefined) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    const controller = new AbortController();

    const loadPayments = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(`${API_BASE_URL}/api/members/${memberId}/payments`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        const data = (await response.json()) as MemberPaymentHistoryRecord[] | { error?: string };

        if (!response.ok) {
          const message = 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Failed to load payment history';
          throw new Error(message);
        }

        setApiPayments(Array.isArray(data) ? data : []);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load payment history';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPayments();

    return () => {
      controller.abort();
    };
  }, [memberId, payments]);

  const sourcePayments = payments ?? apiPayments;

  const memberPayments = useMemo(() => {
    return sourcePayments
      .filter((paymentRecord) => paymentRecord.memberId === memberId)
      .sort((leftRecord, rightRecord) => {
        return new Date(rightRecord.paidAt).getTime() - new Date(leftRecord.paidAt).getTime();
      });
  }, [memberId, sourcePayments]);

  const yearOptions = useMemo(() => {
    return Array.from(
      new Set(
        memberPayments.map((paymentRecord) => {
          return String(new Date(paymentRecord.paidAt).getFullYear());
        }),
      ),
    ).sort((leftYear, rightYear) => Number(rightYear) - Number(leftYear));
  }, [memberPayments]);

  const filteredPayments = useMemo(() => {
    return memberPayments.filter((paymentRecord) => {
      const paidDate = new Date(paymentRecord.paidAt);
      const monthMatches = selectedMonth === 'ALL' || String(paidDate.getMonth() + 1) === selectedMonth;
      const yearMatches = selectedYear === 'ALL' || String(paidDate.getFullYear()) === selectedYear;
      return monthMatches && yearMatches;
    });
  }, [memberPayments, selectedMonth, selectedYear]);

  return (
    <section
      className="
        w-130 max-w-full border border-neutral-300 bg-surface-alt
        px-5 py-5 sm:px-8 sm:py-7
      "
    >
      {isLoading && (
        <div className="mb-4 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
          Loading payment history...
        </div>
      )}

      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <PaymentHistoryFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />
      <PaymentHistoryList payments={filteredPayments} />
    </section>
  );
}