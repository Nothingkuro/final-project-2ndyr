import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import AddMemberModal from '../../../../components/members/AddMemberModal';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Modals/Add Member Modal',
  component: AddMemberModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    onClose: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof AddMemberModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileOpenEmpty: Story = {
  args: {
    isOpen: true,
  },
};

export const MobileOpenPrefilled: Story = {
  args: {
    isOpen: true,
    initialData: {
      firstName: 'Mara',
      lastName: 'Santos',
      contactNumber: '09171234567',
      notes: 'Returning member after 2 months',
    },
  },
};

export const MobileWithError: Story = {
  args: {
    isOpen: true,
    errorMessage: 'Contact number already exists.',
    initialData: {
      firstName: 'Lea',
      lastName: 'Fernandez',
      contactNumber: '09171234567',
      notes: 'Wants evening slot',
    },
  },
};

export const MobileLongFormInput: Story = {
  args: {
    isOpen: true,
    initialData: {
      firstName: 'Maria Cristina',
      lastName: 'Dela Cruz-Santiago',
      contactNumber: '+63 917 123 4567',
      notes:
        'Prefers weekday evening sessions and requested reminders for renewal one week before expiry.',
    },
  },
};
