/** Membership plan interface based on the Prisma MembershipPlan model */
export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Form data for creating / editing a membership plan */
export interface MembershipPlanFormData {
  name: string;
  description: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}
