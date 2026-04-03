import type { MemberPaymentHistoryRecord } from '../../../types/payment';

function formatPaymentDate(dateIso: string): string {
  const dateValue = new Date(dateIso);

  if (Number.isNaN(dateValue.getTime())) {
    return '--';
  }

  return dateValue.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatPaymentId(paymentId: string): string {
  return paymentId.length > 10 ? `${paymentId.slice(0, 10)}...` : paymentId;
}

interface PaymentHistoryCardProps {
  payment: MemberPaymentHistoryRecord;
}

export default function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const amountLabel = `${payment.amountPhp.toLocaleString('en-PH')} Php`;
  const paymentIdLabel = formatPaymentId(payment.id);

  return (
    <article className="w-full rounded-sm bg-primary px-6 py-4 text-center text-text-light shadow-card">
      <h3 className="text-2xl leading-tight">Payment #{paymentIdLabel}</h3>
      <p className="mt-2 text-lg leading-tight">{formatPaymentDate(payment.paidAt)}</p>
      <p className="mt-1 text-lg leading-tight">{amountLabel}</p>
      <p className="mt-1 text-lg leading-tight">{payment.membershipPlan}</p>
      <p className="mt-1 text-lg leading-tight">Issued by: {payment.processedBy}</p>
    </article>
  );
}