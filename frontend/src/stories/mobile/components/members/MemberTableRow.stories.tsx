import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MemberTableRow from '../../../../components/members/MemberTableRow';
import { storyMembers } from '../../../mocks/mockMembers';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Members/Member Table Row',
  component: MemberTableRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...mobileViewport,
  },
  render: (args) => (
    <div className="max-w-3xl rounded-lg border border-neutral-300 overflow-hidden bg-surface">
      <MemberTableRow {...args} />
    </div>
  ),
} satisfies Meta<typeof MemberTableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileActiveDefault: Story = {
  args: {
    member: storyMembers[0],
    index: 0,
    isHovered: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const MobileExpiredHovered: Story = {
  args: {
    member: storyMembers[2],
    index: 1,
    isHovered: true,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const MobileLongName: Story = {
  args: {
    member: {
      ...storyMembers[0],
      id: 'MEMBER-ID-2026-ULTRA-LONG',
      firstName: 'MaximilianAlexander',
      lastName: 'VanDerBergstein',
    },
    index: 2,
    isHovered: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};
