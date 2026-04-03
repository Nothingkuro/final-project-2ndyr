export type PaymentMethod = 'CASH' | 'GCASH';

export type PaymentMemberStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

export interface PaymentMember {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  status: PaymentMemberStatus;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  description?: string;
}

export interface MemberPaymentHistoryRecord {
  id: string;
  memberId: string;
  paidAt: string;
  amountPhp: number;
  membershipPlan: string;
  processedBy: string;
  paymentMethod?: PaymentMethod;
}
