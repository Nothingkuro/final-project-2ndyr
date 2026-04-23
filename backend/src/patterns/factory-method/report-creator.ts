import { Member } from '@prisma/client';
import {
  AtRiskMemberDTO,
  AtRiskMemberFactory,
  AtRiskMemberInput,
  ExpiryAlertDTO,
  ExpiryAlertFactory,
  InventoryAlertDTO,
  InventoryAlertFactory,
  InventoryAlertInput,
  PeakUtilizationDTO,
  PeakUtilizationFactory,
  PeakUtilizationInput,
  RevenueForecastDTO,
  RevenueForecastFactory,
  RevenueForecastInput,
} from './report.factory';
import { ReportType } from './report.types';

/**
 * Central Factory Method entry point for building report DTOs from domain data.
 *
 * The `ReportType` value acts as a contract selector: it determines which factory
 * is used and which input shape is valid at both compile-time (overloads) and
 * runtime (type guards).
 */
export class ReportCreator {
  private static expiryAlertFactory = new ExpiryAlertFactory();
  private static inventoryAlertFactory = new InventoryAlertFactory();
  private static atRiskMemberFactory = new AtRiskMemberFactory();
  private static revenueForecastFactory = new RevenueForecastFactory();
  private static peakUtilizationFactory = new PeakUtilizationFactory();

  /**
   * Creates one report DTO for an expiry alert using member profile data.
   */
  public static createReport(
    type: ReportType.EXPIRY_ALERT,
    data: Member,
  ): ExpiryAlertDTO;

  /**
   * Creates one report DTO for low inventory alerts.
   */
  public static createReport(
    type: ReportType.INVENTORY_ALERT,
    data: InventoryAlertInput,
  ): InventoryAlertDTO;

  /**
   * Creates one report DTO for churn-risk monitoring.
   */
  public static createReport(
    type: ReportType.AT_RISK_MEMBER,
    data: AtRiskMemberInput,
  ): AtRiskMemberDTO;

  /**
   * Creates one revenue-forecast DTO from model output values.
   */
  public static createReport(
    type: ReportType.REVENUE_FORECAST,
    data: RevenueForecastInput,
  ): RevenueForecastDTO;

  /**
   * Creates one utilization DTO from hourly attendance aggregation rows.
   */
  public static createReport(
    type: ReportType.PEAK_UTILIZATION,
    data: PeakUtilizationInput,
  ): PeakUtilizationDTO;

  /**
   * Generic overload for callers that already provide explicit input/output typing.
   *
   * The `type` argument still controls the expected data shape and chosen concrete
   * factory at runtime.
   */
  public static createReport<TInput, TOutput>(type: ReportType, data: TInput): TOutput;

  /**
   * Runtime dispatcher for the Factory Method pattern.
   *
   * Each `ReportType` branch validates the incoming payload before invoking the
   * corresponding concrete factory, preventing invalid cross-type payload usage.
   */
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
      case ReportType.AT_RISK_MEMBER:
        if (!this.isAtRiskMemberInput(data)) {
          throw new Error('Invalid input for report type: AT_RISK_MEMBER');
        }
        return this.atRiskMemberFactory.create(data);
      case ReportType.REVENUE_FORECAST:
        if (!this.isRevenueForecastInput(data)) {
          throw new Error('Invalid input for report type: REVENUE_FORECAST');
        }
        return this.revenueForecastFactory.create(data);
      case ReportType.PEAK_UTILIZATION:
        if (!this.isPeakUtilizationInput(data)) {
          throw new Error('Invalid input for report type: PEAK_UTILIZATION');
        }
        return this.peakUtilizationFactory.create(data);
      default:
        throw new Error(`No report factory registered for type: ${type}`);
    }
  }

  /**
   * Batch variant for expiry-alert transformation.
   */
  public static createReportBatch(
    type: ReportType.EXPIRY_ALERT,
    data: Member[],
  ): ExpiryAlertDTO[];

  /**
   * Batch variant for low-inventory transformation.
   */
  public static createReportBatch(
    type: ReportType.INVENTORY_ALERT,
    data: InventoryAlertInput[],
  ): InventoryAlertDTO[];

  /**
   * Batch variant for at-risk member transformation.
   */
  public static createReportBatch(
    type: ReportType.AT_RISK_MEMBER,
    data: AtRiskMemberInput[],
  ): AtRiskMemberDTO[];

  /**
   * Batch variant for peak-utilization transformation.
   */
  public static createReportBatch(
    type: ReportType.PEAK_UTILIZATION,
    data: PeakUtilizationInput[],
  ): PeakUtilizationDTO[];

  /**
   * Generic batch overload for callers that specify explicit list typing.
   */
  public static createReportBatch<TInput, TOutput>(
    type: ReportType,
    data: TInput[],
  ): TOutput[];

  /**
   * Runtime-safe batch dispatcher.
   *
   * Guards every item to ensure one malformed row cannot silently produce partial
   * or corrupted report output.
   */
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
      case ReportType.AT_RISK_MEMBER:
        if (!data.every((item): item is AtRiskMemberInput => this.isAtRiskMemberInput(item))) {
          throw new Error('Invalid input for report type: AT_RISK_MEMBER');
        }
        return data.map((item) => this.createReport(ReportType.AT_RISK_MEMBER, item));
      case ReportType.PEAK_UTILIZATION:
        if (!data.every((item): item is PeakUtilizationInput => this.isPeakUtilizationInput(item))) {
          throw new Error('Invalid input for report type: PEAK_UTILIZATION');
        }
        return data.map((item) => this.createReport(ReportType.PEAK_UTILIZATION, item));
      default:
        throw new Error(`No report factory registered for type: ${type}`);
    }
  }

  /**
   * Shared helper to verify an unknown value is a non-null object map.
   */
  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Runtime safety check for member-shaped input before expiry/risk transformations.
   *
   * This defends the factory pipeline from invalid payloads when data crosses
   * module or serialization boundaries.
   */
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

  /**
   * Runtime safety check for low-inventory payload shape.
   */
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

  /**
   * Runtime safety check for at-risk member payload shape.
   */
  private static isAtRiskMemberInput(value: unknown): value is AtRiskMemberInput {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      this.isMember(value.member) &&
      typeof value.daysUntilExpiry === 'number' &&
      (value.lastCheckInTime === null || value.lastCheckInTime instanceof Date)
    );
  }

  /**
   * Runtime safety check for revenue-forecast payload shape.
   */
  private static isRevenueForecastInput(value: unknown): value is RevenueForecastInput {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      (value.projection === 'CONSERVATIVE' || value.projection === 'OPTIMISTIC') &&
      typeof value.baselineActivePlanRevenue === 'number' &&
      typeof value.projectedChurnAdjustment === 'number' &&
      typeof value.forecastedRevenue === 'number'
    );
  }

  /**
   * Runtime safety check for hourly utilization payload shape.
   */
  private static isPeakUtilizationInput(value: unknown): value is PeakUtilizationInput {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.hour === 'number' &&
      typeof value.planName === 'string' &&
      typeof value.count === 'number'
    );
  }
}
