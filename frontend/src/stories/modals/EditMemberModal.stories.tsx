import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MemberFormModal from '../../components/members/AddMemberModal';

const meta = {
  title: 'App/Modals/Edit Member Modal',
  component: MemberFormModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    onClose: fn(),
    onSubmit: fn(),
    title: 'Edit Profile',
    submitLabel: 'Save Changes',
    submittingLabel: 'Saving...',
  },
} satisfies Meta<typeof MemberFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};

export const OpenPrefilled: Story = {
  args: {
    initialData: {
      firstName: 'John Elmo',
      lastName: 'Doe',
      contactNumber: '123445456464',
      notes: 'Needs follow-up next week.',
    },
  },
};

export const SavingState: Story = {
  args: {
    isSubmitting: true,
    initialData: {
      firstName: 'John Elmo',
      lastName: 'Doe',
      contactNumber: '123445456464',
      notes: 'Updated contact details pending confirmation.',
    },
  },
};

export const WithValidationError: Story = {
  args: {
    errorMessage: 'Contact number already exists.',
    initialData: {
      firstName: 'John Elmo',
      lastName: 'Doe',
      contactNumber: '123445456465',
      notes: 'Tried to update to an existing number.',
    },
  },
};

export const LongFormValues: Story = {
  args: {
    initialData: {
      firstName: 'Maria Cristina',
      lastName: 'Dela Cruz-Santiago',
      contactNumber: '+63 917 123 4567',
      notes:
        'Prefers weekday evening sessions and requested reminders for renewal one week before expiry.',
    },
  },
};
