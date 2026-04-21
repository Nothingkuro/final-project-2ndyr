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
