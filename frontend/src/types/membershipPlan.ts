/** Membership plan interface based on the Prisma MembershipPlan model */
/**
 * Defines membership plan used by frontend domain models.
 */
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
/**
 * Defines membership plan form data used by frontend domain models.
 */
export interface MembershipPlanFormData {
  name: string;
  description: string;
  durationDays: number;
  price: number;
  isActive: boolean;
}
