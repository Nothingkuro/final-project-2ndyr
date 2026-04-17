import type { Meta, StoryObj } from '@storybook/react-vite';
import ConditionBadge from '../../../../components/equipment/ConditionBadge';
import { EquipmentCondition } from '../../../../types/equipment';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Equipment/Condition Badge',
  component: ConditionBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
} satisfies Meta<typeof ConditionBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileGood: Story = {
  args: {
    condition: EquipmentCondition.GOOD,
    variant: 'pill',
  },
};

export const MobileMaintenance: Story = {
  args: {
    condition: EquipmentCondition.MAINTENANCE,
    variant: 'pill',
  },
};

export const MobileBroken: Story = {
  args: {
    condition: EquipmentCondition.BROKEN,
    variant: 'pill',
  },
};
