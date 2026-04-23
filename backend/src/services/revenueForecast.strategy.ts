export type ForecastMode = 'CONSERVATIVE' | 'OPTIMISTIC';

export type RevenueForecastInput = {
  baselineActivePlanRevenue: number;
  projectedChurnAdjustment: number;
};

export type RevenueForecastResult = {
  projection: ForecastMode;
  baselineActivePlanRevenue: number;
  projectedChurnAdjustment: number;
  forecastedRevenue: number;
};

export interface IForecastStrategy {
  readonly mode: ForecastMode;
  project(input: RevenueForecastInput): RevenueForecastResult;
}

class ConservativeRevenueForecast implements IForecastStrategy {
  readonly mode: ForecastMode = 'CONSERVATIVE';

  project(input: RevenueForecastInput): RevenueForecastResult {
    const forecastedRevenue = Math.max(
      0,
      input.baselineActivePlanRevenue - input.projectedChurnAdjustment,
    );

    return {
      projection: this.mode,
      baselineActivePlanRevenue: input.baselineActivePlanRevenue,
      projectedChurnAdjustment: input.projectedChurnAdjustment,
      forecastedRevenue,
    };
  }
}

class OptimisticRevenueForecast implements IForecastStrategy {
  readonly mode: ForecastMode = 'OPTIMISTIC';

  project(input: RevenueForecastInput): RevenueForecastResult {
    return {
      projection: this.mode,
      baselineActivePlanRevenue: input.baselineActivePlanRevenue,
      projectedChurnAdjustment: input.projectedChurnAdjustment,
      forecastedRevenue: input.baselineActivePlanRevenue,
    };
  }
}

export class RevenueForecastContext {
  constructor(private readonly strategies: IForecastStrategy[]) {}

  project(mode: ForecastMode, input: RevenueForecastInput): RevenueForecastResult {
    const strategy = this.strategies.find((candidate) => candidate.mode === mode);

    if (!strategy) {
      throw new Error('Unsupported forecast mode');
    }

    return strategy.project(input);
  }
}

export const revenueForecastContext = new RevenueForecastContext([
  new ConservativeRevenueForecast(),
  new OptimisticRevenueForecast(),
]);

export default revenueForecastContext;
