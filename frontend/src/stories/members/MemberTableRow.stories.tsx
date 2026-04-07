import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MemberTableRow from '../../components/members/MemberTableRow';
import { storyMembers } from '../mocks/mockMembers';

const meta = {
  title: 'App/Members/Member Table Row',
  component: MemberTableRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="max-w-3xl rounded-lg border border-neutral-300 overflow-hidden bg-surface">
      <MemberTableRow {...args} />
    </div>
  ),
} satisfies Meta<typeof MemberTableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveDefault: Story = {
  args: {
    member: storyMembers[0],
    index: 0,
    isHovered: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const ExpiredHovered: Story = {
  args: {
    member: storyMembers[2],
    index: 1,
    isHovered: true,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const InactiveDefault: Story = {
  args: {
    member: storyMembers[4],
    index: 2,
    isHovered: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const LongIdAndMemberName: Story = {
  args: {
    member: {
      ...storyMembers[0],
      id: 'MEMBER-ID-2026-ULTRA-LONG-ALPHA-NUMERIC-000000000123456789',
      firstName: 'MaximilianAlexanderTheThirdOfNorthernHighlands',
      lastName: 'VanDerBergsteinMontgomeryLongfellowSantiago',
    },
    index: 3,
    isHovered: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};
