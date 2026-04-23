import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AnalyticsCharts from '../../components/reports/AnalyticsCharts';
import {
  storyMonthlyRevenue,
  storyPeakUtilization,
  storyRevenueForecastConservative,
} from '../mocks/mockReports';
import type { ForecastMode } from '../../types/report';

function AnalyticsChartsPlayground(args: ComponentProps<typeof AnalyticsCharts>) {
  const [forecastMode, setForecastMode] = useState<ForecastMode>(args.forecastMode);

  return (
    <AnalyticsCharts
      {...args}
      forecastMode={forecastMode}
      onForecastModeChange={setForecastMode}
    />
  );
}

const meta = {
  title: 'App/Reports/Analytics Charts',
  component: AnalyticsCharts,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="grid w-[95vw] max-w-5xl grid-cols-1 gap-4 rounded-xl bg-surface-alt p-4 sm:p-6 lg:grid-cols-2">
      <AnalyticsChartsPlayground {...args} />
    </div>
  ),
} satisfies Meta<typeof AnalyticsCharts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    monthlyRevenue: storyMonthlyRevenue,
    revenueForecast: storyRevenueForecastConservative,
    peakUtilization: storyPeakUtilization,
    forecastMode: 'CONSERVATIVE',
    onForecastModeChange: () => {},
    isForecastLoading: false,
    isUtilizationLoading: false,
  },
};

export const Loading: Story = {
  args: {
    monthlyRevenue: storyMonthlyRevenue,
    revenueForecast: storyRevenueForecastConservative,
    peakUtilization: storyPeakUtilization,
    forecastMode: 'CONSERVATIVE',
    onForecastModeChange: () => {},
    isForecastLoading: true,
    isUtilizationLoading: true,
  },
};

export const Empty: Story = {
  args: {
    monthlyRevenue: [],
    revenueForecast: null,
    peakUtilization: [],
    forecastMode: 'CONSERVATIVE',
    onForecastModeChange: () => {},
    isForecastLoading: false,
    isUtilizationLoading: false,
  },
};
