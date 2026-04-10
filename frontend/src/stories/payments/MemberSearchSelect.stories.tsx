import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import MemberSearchSelect from '../../components/payments/MemberSearchSelect';
import { storyPaymentMembers } from '../mocks/mockMembers';

const meta = {
  title: 'App/Payments/Member Search Select',
  component: MemberSearchSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MemberSearchSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function MemberSearchSelectPlayground(args: ComponentProps<typeof MemberSearchSelect>) {
  const [selectedMemberId, setSelectedMemberId] = useState(args.selectedMemberId);

  return (
    <div className="max-w-xl">
      <MemberSearchSelect
        {...args}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
      />
    </div>
  );
}

export const HappyWithMatches: Story = {
  args: {
    members: storyPaymentMembers,
    selectedMemberId: '67',
    onSelectMember: () => {},
  },
  render: (args) => <MemberSearchSelectPlayground {...args} />,
};

export const SadNoResults: Story = {
  args: {
    members: [],
    selectedMemberId: '',
    onSelectMember: () => {},
    disabled: true,
  },
  render: (args) => <MemberSearchSelectPlayground {...args} />,
};
