import type { MemberPaymentHistoryRecord } from '../../../types/payment';
import PaymentHistoryCard from './PaymentHistoryCard';

interface PaymentHistoryListProps {
  payments: MemberPaymentHistoryRecord[];
}

export default function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-neutral-500">
        No payment records found for the selected month and year.
      </div>
    );
  }

  return (
    <div className="mt-6 w-full max-h-96 overflow-y-auto rounded-md border border-neutral-300 bg-neutral-100 px-4 py-5 sm:px-6">
      <div className="w-full space-y-5">
        {payments.map((payment) => (
          <PaymentHistoryCard key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}