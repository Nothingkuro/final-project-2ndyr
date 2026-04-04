import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { Equipment } from '../../types/equipment';
import { EquipmentCondition } from '../../types/equipment';
import EquipmentTableRow from '../../components/equipment/EquipmentTableRow';
import { longNameEquipment, newTreadmill } from '../helpers/mockEquipment';

type EquipmentRowStoryArgs = {
  id: string;
  itemName: string;
  quantity: number;
  condition: EquipmentCondition;
  mode: 'status' | 'admin';
  isHovered: boolean;
  index: number;
};

function buildEquipment(args: EquipmentRowStoryArgs): Equipment {
  return {
    id: args.id,
    itemName: args.itemName,
    quantity: args.quantity,
    condition: args.condition,
    lastChecked: '2026-04-04T10:00:00.000Z',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-04-04T10:00:00.000Z',
  };
}

function EquipmentTableRowStory(args: EquipmentRowStoryArgs) {
  const equipment = buildEquipment(args);

  return (
    <div className="w-190 max-w-full rounded-lg border border-neutral-300 overflow-hidden bg-surface">
      <table className="w-full border-collapse">
        <tbody>
          <EquipmentTableRow
            equipment={equipment}
            mode={args.mode}
            index={args.index}
            isHovered={args.isHovered}
            onMouseEnter={fn()}
            onMouseLeave={fn()}
            onEditStatus={fn()}
            onEditAsset={fn()}
            onDeleteAsset={fn()}
          />
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: 'App/Equipment/Equipment Table Row',
  component: EquipmentTableRowStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    itemName: { control: 'text' },
    quantity: { control: { type: 'number', min: 0, step: 1 } },
    condition: {
      control: 'select',
      options: [EquipmentCondition.GOOD, EquipmentCondition.MAINTENANCE, EquipmentCondition.BROKEN],
    },
    mode: {
      control: 'select',
      options: ['status', 'admin'],
    },
    isHovered: { control: 'boolean' },
    index: { control: { type: 'number', min: 0, step: 1 } },
    id: { control: 'text' },
  },
} satisfies Meta<typeof EquipmentTableRowStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    id: newTreadmill.id,
    itemName: newTreadmill.itemName,
    quantity: newTreadmill.quantity,
    condition: newTreadmill.condition,
    mode: 'status',
    isHovered: false,
    index: 0,
  },
};

export const LowStock: Story = {
  args: {
    id: 'EQ-LOW-STOCK',
    itemName: 'Battle Rope',
    quantity: 1,
    condition: EquipmentCondition.MAINTENANCE,
    mode: 'status',
    isHovered: false,
    index: 1,
  },
};

export const OutOfStock: Story = {
  args: {
    id: 'EQ-OUT-OF-STOCK',
    itemName: 'Resistance Band Pack',
    quantity: 0,
    condition: EquipmentCondition.BROKEN,
    mode: 'status',
    isHovered: false,
    index: 2,
  },
};

export const LongName: Story = {
  args: {
    id: longNameEquipment.id,
    itemName: longNameEquipment.itemName,
    quantity: longNameEquipment.quantity,
    condition: longNameEquipment.condition,
    mode: 'status',
    isHovered: false,
    index: 3,
  },
};

export const EditConditionAction: Story = {
  args: {
    id: 'EQ-EDIT-CONDITION',
    itemName: 'Chest Fly Machine',
    quantity: 2,
    condition: EquipmentCondition.MAINTENANCE,
    mode: 'status',
    isHovered: true,
    index: 4,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Edit condition for Chest Fly Machine' });

    await userEvent.click(button);

    expect(button).toHaveAttribute('title', 'Edit condition');
  },
};

export const InlineConditionEditing: Story = {
  args: {
    id: 'EQ-INLINE-EDIT',
    itemName: 'Assisted Pull-Up Machine',
    quantity: 2,
    condition: EquipmentCondition.GOOD,
    mode: 'status',
    isHovered: false,
    index: 5,
  },
  render: () => (
    <div className="w-190 max-w-full rounded-lg border border-neutral-300 overflow-hidden bg-surface">
      <table className="w-full border-collapse">
        <tbody>
          <EquipmentTableRow
            equipment={buildEquipment({
              id: 'EQ-INLINE-EDIT',
              itemName: 'Assisted Pull-Up Machine',
              quantity: 2,
              condition: EquipmentCondition.GOOD,
              mode: 'status',
              isHovered: false,
              index: 5,
            })}
            mode="status"
            index={5}
            isHovered={false}
            onMouseEnter={fn()}
            onMouseLeave={fn()}
            onEditStatus={fn()}
            isEditingCondition
            editedCondition={EquipmentCondition.MAINTENANCE}
            onConditionChange={fn()}
            onSaveCondition={fn()}
            onCancelConditionEdit={fn()}
          />
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByRole('combobox', { name: 'Condition for Assisted Pull-Up Machine' })).toBeInTheDocument();
    expect(canvas.getByRole('button', { name: 'Save condition for Assisted Pull-Up Machine' })).toBeInTheDocument();
    expect(canvas.getByRole('button', { name: 'Cancel editing condition for Assisted Pull-Up Machine' })).toBeInTheDocument();
  },
};

export const AdminModeActions: Story = {
  args: {
    id: 'EQ-ADMIN-ROW',
    itemName: 'Power Rack',
    quantity: 2,
    condition: EquipmentCondition.GOOD,
    mode: 'admin',
    isHovered: true,
    index: 6,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByRole('button', { name: 'Edit asset Power Rack' })).toBeInTheDocument();
    expect(canvas.getByRole('button', { name: 'Delete asset Power Rack' })).toBeInTheDocument();
  },
};
