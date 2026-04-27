import type { MemberPaymentHistoryRecord } from '../../../types/payment';

/**
 * Handles format payment date logic for feature UI behavior.
 *
 * @param dateIso Input used by format payment date.
 * @returns Computed value for the caller.
 */
function formatPaymentDate(dateIso: string): string {
  const dateValue = new Date(dateIso);

  if (Number.isNaN(dateValue.getTime())) {
    return '--';
  }

  return dateValue.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Defines payment history card props used by feature UI behavior.
 */
interface PaymentHistoryCardProps {
  /**
   * Data used for payment behavior.
   */
  payment: MemberPaymentHistoryRecord;
}

/**
 * Renders the payment history card view for feature UI behavior.
 *
 * @param params Input consumed by payment history card.
 * @returns Rendered JSX content.
 */
export default function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const amountLabel = `${payment.amountPhp.toLocaleString('en-PH')} Php`;
  const showGcashReference = payment.paymentMethod === 'GCASH';
  const gcashReferenceLabel = payment.referenceNumber?.trim() || 'N/A';

  return (
    <article className="w-full rounded-sm bg-primary px-6 py-4 text-center text-text-light shadow-card">
      <p className="mt-2 text-lg leading-tight">{formatPaymentDate(payment.paidAt)}</p>
      <p className="mt-1 text-lg leading-tight">{amountLabel}</p>
      <p className="mt-1 text-lg leading-tight">{payment.membershipPlan}</p>
      {showGcashReference && (
        <p className="mt-1 text-lg leading-tight">GCash Ref: {gcashReferenceLabel}</p>
      )}
      <p className="mt-1 text-lg leading-tight">Issued by: {payment.processedBy}</p>
    </article>
  );
}