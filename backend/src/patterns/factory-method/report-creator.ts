import { Member } from '@prisma/client';
import {
  ExpiryAlertDTO,
  ExpiryAlertFactory,
  InventoryAlertDTO,
  InventoryAlertFactory,
  InventoryAlertInput,
} from './report.factory';
import { ReportType } from './report.types';

export class ReportCreator {
  private static expiryAlertFactory = new ExpiryAlertFactory();
  private static inventoryAlertFactory = new InventoryAlertFactory();

  public static createReport(
    type: ReportType.EXPIRY_ALERT,
    data: Member,
  ): ExpiryAlertDTO;
  public static createReport(
    type: ReportType.INVENTORY_ALERT,
    data: InventoryAlertInput,
  ): InventoryAlertDTO;
  public static createReport<TInput, TOutput>(type: ReportType, data: TInput): TOutput;
  public static createReport(type: ReportType, data: unknown): unknown {
    switch (type) {
      case ReportType.EXPIRY_ALERT:
        if (!this.isMember(data)) {
          throw new Error('Invalid input for report type: EXPIRY_ALERT');
        }
        return this.expiryAlertFactory.create(data);
      case ReportType.INVENTORY_ALERT:
        if (!this.isInventoryAlertInput(data)) {
          throw new Error('Invalid input for report type: INVENTORY_ALERT');
        }
        return this.inventoryAlertFactory.create(data);
      default:
        throw new Error(`No report factory registered for type: ${type}`);
    }
  }

  public static createReportBatch(
    type: ReportType.EXPIRY_ALERT,
    data: Member[],
  ): ExpiryAlertDTO[];
  public static createReportBatch(
    type: ReportType.INVENTORY_ALERT,
    data: InventoryAlertInput[],
  ): InventoryAlertDTO[];
  public static createReportBatch<TInput, TOutput>(
    type: ReportType,
    data: TInput[],
  ): TOutput[];
  public static createReportBatch(
    type: ReportType,
    data: unknown[],
  ): unknown[] {
    switch (type) {
      case ReportType.EXPIRY_ALERT:
        if (!data.every((item): item is Member => this.isMember(item))) {
          throw new Error('Invalid input for report type: EXPIRY_ALERT');
        }
        return data.map((item) => this.createReport(ReportType.EXPIRY_ALERT, item));
      case ReportType.INVENTORY_ALERT:
        if (!data.every((item): item is InventoryAlertInput => this.isInventoryAlertInput(item))) {
          throw new Error('Invalid input for report type: INVENTORY_ALERT');
        }
        return data.map((item) => this.createReport(ReportType.INVENTORY_ALERT, item));
      default:
        throw new Error(`No report factory registered for type: ${type}`);
    }
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private static isMember(value: unknown): value is Member {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id === 'string' &&
      typeof value.firstName === 'string' &&
      typeof value.lastName === 'string' &&
      typeof value.contactNumber === 'string'
    );
  }

  private static isInventoryAlertInput(value: unknown): value is InventoryAlertInput {
    if (!this.isRecord(value)) {
      return false;
    }

    if (typeof value.threshold !== 'number' || !this.isRecord(value.equipment)) {
      return false;
    }

    return (
      typeof value.equipment.id === 'string' &&
      typeof value.equipment.itemName === 'string' &&
      typeof value.equipment.quantity === 'number'
    );
  }
}
