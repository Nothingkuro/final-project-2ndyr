import type { Meta, StoryObj } from '@storybook/react-vite';
import MemberAttendanceHistoryPanel from '../../../../components/members/attendance/MemberAttendanceHistoryPanel';
import type { Attendance } from '../../../../types/attendance';

const sampleAttendanceRecords: Attendance[] = [
  {
    id: 'att-0001-very-long-attendance-id',
    checkInTime: '2026-04-15T09:30:00.000Z',
    memberId: 'member-001',
  },
  {
    id: 'att-0002-very-long-attendance-id',
    checkInTime: '2026-04-16T06:10:00.000Z',
    memberId: 'member-001',
  },
  {
    id: 'att-0003-very-long-attendance-id',
    checkInTime: '2026-04-16T07:45:00.000Z',
    memberId: 'member-002',
  },
];

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Attendance/Member Attendance History Panel',
  component: MemberAttendanceHistoryPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
} satisfies Meta<typeof MemberAttendanceHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileWithHistory: Story = {
  args: {
    memberId: 'member-001',
    attendances: sampleAttendanceRecords,
  },
};

export const MobileEmptyHistory: Story = {
  args: {
    memberId: 'member-003',
    attendances: sampleAttendanceRecords,
  },
};
