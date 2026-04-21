/**
 * Type alias for payment method in frontend domain models.
 */
export type PaymentMethod = 'CASH' | 'GCASH';

/**
 * Type alias for payment member status in frontend domain models.
 */
export type PaymentMemberStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

/**
 * Defines payment member used by frontend domain models.
 */
export interface PaymentMember {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  status: PaymentMemberStatus;
}

/**
 * Defines membership plan used by frontend domain models.
 */
export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  description?: string;
}

/**
 * Defines payment request payload used by frontend domain models.
 */
export interface CreatePaymentRequest {
  memberId: string;
  planId: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  referenceNumber?: string;
}

/**
 * Defines member payment history record used by frontend domain models.
 */
export interface MemberPaymentHistoryRecord {
  id: string;
  memberId: string;
  paidAt: string;
  amountPhp: number;
  membershipPlan: string;
  processedBy: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
}
