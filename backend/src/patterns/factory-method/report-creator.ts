import { Member } from '@prisma/client';
import { IFactory } from './factory.interface';
import {
  ExpiryAlertDTO,
  ExpiryAlertFactory,
  InventoryAlertDTO,
  InventoryAlertFactory,
  InventoryAlertInput,
} from './report.factory';
import { ReportType } from './report.types';

type RegisteredReportFactory =
  | IFactory<Member, ExpiryAlertDTO>
  | IFactory<InventoryAlertInput, InventoryAlertDTO>;

export class ReportCreator {
  private static factories: Map<ReportType, RegisteredReportFactory> =
    new Map<ReportType, RegisteredReportFactory>([
    [ReportType.EXPIRY_ALERT, new ExpiryAlertFactory()],
    [
      ReportType.INVENTORY_ALERT,
      new InventoryAlertFactory(),
    ],
    ]);

  public static createReport<TInput, TOutput>(type: ReportType, data: TInput): TOutput {
    const factory = this.factories.get(type) as IFactory<TInput, TOutput> | undefined;

    if (!factory) {
      throw new Error(`No report factory registered for type: ${type}`);
    }

    return factory.create(data);
  }

  public static createReportBatch<TInput, TOutput>(
    type: ReportType,
    data: TInput[],
  ): TOutput[] {
    return data.map((item) => this.createReport<TInput, TOutput>(type, item));
  }
}
