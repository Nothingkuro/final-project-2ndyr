import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import EquipmentPage from '../../pages/EquipmentPage';
import { EquipmentCondition } from '../../types/equipment';
import { storyEquipment } from '../helpers/mockEquipment';
import { setMockEquipmentStore } from '../../services/mockEquipmentStore';

const meta = {
  title: 'App/Pages/Equipment Status Page',
  component: EquipmentPage,
  parameters: {
    layout: 'fullscreen',
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

export const SuccessData: Story = {
  render: () => <EquipmentPageCanvas />,
};

export const EmptyState: Story = {
  parameters: {
    mockEquipment: [],
  },
  render: () => <EquipmentPageCanvas />,
};

export const StatusOnlyControls: Story = {
  render: () => <EquipmentPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: /Add asset/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /Delete asset/i })).not.toBeInTheDocument();
    });

    expect(canvas.getByRole('button', { name: /Edit condition for New Treadmill/i })).toBeInTheDocument();
  },
};

export const NoResultsFound: Story = {
  render: () => <EquipmentPageCanvas initialSearchQuery="this-item-does-not-exist" />,
};

export const SearchAndFilterFlow: Story = {
  render: () => <EquipmentPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    const searchInput = canvas.getByPlaceholderText('Search equipment...');
    await slowUser.clear(searchInput);
    await slowUser.type(searchInput, 'treadmill');

    await waitFor(() => {
      expect(canvas.getByText('New Treadmill')).toBeInTheDocument();
      expect(canvas.queryByText('Wobbly Bench')).not.toBeInTheDocument();
    });

    await slowUser.click(canvas.getByRole('button', { name: 'Filter' }));
    await slowUser.click(canvas.getByRole('button', { name: 'Broken' }));

    await waitFor(() => {
      expect(canvas.getByText('No equipment found matching your search.')).toBeInTheDocument();
    });
  },
};

export const EditConditionOnlyFlow: Story = {
  render: () => <EquipmentPageCanvas />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slowUser = userEvent.setup({ delay: 120 });

    await slowUser.click(
      await canvas.findByRole('button', { name: /Edit condition for New Treadmill/i }),
    );

    const conditionSelect = await canvas.findByRole('combobox', {
      name: /Condition for New Treadmill/i,
    });
    await slowUser.selectOptions(conditionSelect, 'BROKEN');
    await slowUser.click(canvas.getByRole('button', { name: /Save condition for New Treadmill/i }));

    await waitFor(() => {
      expect(canvas.queryByRole('combobox', { name: /Condition for New Treadmill/i })).not.toBeInTheDocument();
    });

    expect(canvas.getByText('Broken')).toBeInTheDocument();
  },
};

export const InitialFilterBroken: Story = {
  render: () => <EquipmentPageCanvas initialFilter={EquipmentCondition.BROKEN} />,
};
