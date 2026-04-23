import { Member, Equipment } from '@prisma/client';
import { IFactory } from './factory.interface';

// DTO for Membership Expiration
export type ExpiryAlertDTO = {
    id: string;
    name: string;
    expiryDate: string;
    contactNumber: string;
};

// DTO for Inventory Alerts
export type InventoryAlertDTO = {
    id: string;
    itemName: string;
    category: string;
    quantity: number;
    threshold: number;
};

export type InventoryAlertInput = {
    equipment: Equipment;
    threshold: number;
};

export type AtRiskMemberDTO = {
    id: string;
    name: string;
    contactNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    lastCheckInTime: string | null;
    riskLevel: 'AT_RISK';
};

export type AtRiskMemberInput = {
    member: Member;
    daysUntilExpiry: number;
    lastCheckInTime: Date | null;
};

export type RevenueForecastDTO = {
    projection: 'CONSERVATIVE' | 'OPTIMISTIC';
    baselineActivePlanRevenue: number;
    projectedChurnAdjustment: number;
    forecastedRevenue: number;
};

export type RevenueForecastInput = RevenueForecastDTO;

export type PeakUtilizationDTO = {
    hour: number;
    planName: string;
    count: number;
};

export type PeakUtilizationInput = PeakUtilizationDTO;

export class ExpiryAlertFactory implements IFactory<Member, ExpiryAlertDTO> {
    create(member: Member): ExpiryAlertDTO {
        return {
            id: member.id,
            name: `${member.firstName} ${member.lastName}`.trim(),
            expiryDate: member.expiryDate ? member.expiryDate.toISOString() : '',
            contactNumber: member.contactNumber,
        };
    }
}

export class InventoryAlertFactory implements IFactory<InventoryAlertInput, InventoryAlertDTO> {
    create(input: InventoryAlertInput): InventoryAlertDTO {
        return {
            id: input.equipment.id,
            itemName: input.equipment.itemName,
            category: 'Equipment', 
            quantity: input.equipment.quantity,
            threshold: input.threshold,
        };
    }
}

export class AtRiskMemberFactory implements IFactory<AtRiskMemberInput, AtRiskMemberDTO> {
    create(input: AtRiskMemberInput): AtRiskMemberDTO {
        return {
            id: input.member.id,
            name: `${input.member.firstName} ${input.member.lastName}`.trim(),
            contactNumber: input.member.contactNumber,
            expiryDate: input.member.expiryDate ? input.member.expiryDate.toISOString() : '',
            daysUntilExpiry: input.daysUntilExpiry,
            lastCheckInTime: input.lastCheckInTime ? input.lastCheckInTime.toISOString() : null,
            riskLevel: 'AT_RISK',
        };
    }
}

export class RevenueForecastFactory implements IFactory<RevenueForecastInput, RevenueForecastDTO> {
    create(input: RevenueForecastInput): RevenueForecastDTO {
        return {
            projection: input.projection,
            baselineActivePlanRevenue: input.baselineActivePlanRevenue,
            projectedChurnAdjustment: input.projectedChurnAdjustment,
            forecastedRevenue: input.forecastedRevenue,
        };
    }
}

export class PeakUtilizationFactory implements IFactory<PeakUtilizationInput, PeakUtilizationDTO> {
    create(input: PeakUtilizationInput): PeakUtilizationDTO {
        return {
            hour: input.hour,
            planName: input.planName,
            count: input.count,
        };
    }
}
