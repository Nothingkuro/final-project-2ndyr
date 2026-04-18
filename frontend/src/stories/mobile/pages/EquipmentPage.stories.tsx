import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import EquipmentPage from '../../../pages/EquipmentPage';
import { EquipmentCondition } from '../../../types/equipment';
import { storyEquipment } from '../../mocks/mockEquipment';
import { setMockEquipmentStore } from '../../mocks/mockEquipmentStore';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Pages/Equipment Status Page',
  component: EquipmentPage,
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  decorators: [
    (Story, context) => {
      const mockEquipment = (context.parameters.mockEquipment as typeof storyEquipment | undefined)
        ?? storyEquipment;
      setMockEquipmentStore(mockEquipment);

      return (
        <MemoryRouter initialEntries={['/dashboard/inventory']}>
          <Story />
        </MemoryRouter>
      );
    },
  ],
} satisfies Meta<typeof EquipmentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function EquipmentPageCanvas(props: ComponentProps<typeof EquipmentPage>) {
  return (
    <div className="min-h-screen bg-surface-alt p-4 sm:p-6 lg:p-8">
      <EquipmentPage {...props} />
    </div>
  );
}

export const MobileSuccessData: Story = {
  render: () => <EquipmentPageCanvas />,
};

export const MobileEmptyState: Story = {
  parameters: {
    mockEquipment: [],
  },
  render: () => <EquipmentPageCanvas />,
};

export const MobileNoResultsFound: Story = {
  render: () => <EquipmentPageCanvas initialSearchQuery="this-item-does-not-exist" />,
};

export const MobileInitialFilterBroken: Story = {
  render: () => <EquipmentPageCanvas initialFilter={EquipmentCondition.BROKEN} />,
};
