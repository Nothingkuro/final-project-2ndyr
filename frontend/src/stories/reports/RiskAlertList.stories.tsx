import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import RiskAlertList from '../../components/reports/RiskAlertList';
import { storyAtRiskMembers } from '../mocks/mockReports';

const meta = {
  title: 'App/Reports/Risk Alert List',
  component: RiskAlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-[95vw] max-w-2xl rounded-xl bg-surface-alt p-4 sm:p-6">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof RiskAlertList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    members: storyAtRiskMembers,
    updatedAt: new Date().toISOString(),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    members: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    members: [],
    isLoading: false,
  },
};
