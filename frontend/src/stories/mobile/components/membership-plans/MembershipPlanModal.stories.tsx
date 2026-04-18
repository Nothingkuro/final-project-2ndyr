import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import MembershipPlanModal from '../../../../components/membership-plans/MembershipPlanModal';
import {
  storyMembershipPlanConfigAddFormData,
  storyMembershipPlanConfigEditFormData,
  storyMembershipPlanConfigErrorMessage,
} from '../../../mocks/mockMembershipPlanConfig';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Membership Plans/Membership Plan Modal',
  component: MembershipPlanModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...mobileViewport,
  },
  args: {
    isOpen: true,
    mode: 'add',
    onClose: fn(),
    onSubmit: fn(),
    initialData: storyMembershipPlanConfigAddFormData,
    errorMessage: null,
  },
} satisfies Meta<typeof MembershipPlanModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileAddMode: Story = {
  args: {
    mode: 'add',
    initialData: storyMembershipPlanConfigAddFormData,
  },
};

export const MobileEditMode: Story = {
  args: {
    mode: 'edit',
    initialData: storyMembershipPlanConfigEditFormData,
  },
};

export const MobileWithErrorMessage: Story = {
  args: {
    mode: 'edit',
    initialData: storyMembershipPlanConfigEditFormData,
    errorMessage: storyMembershipPlanConfigErrorMessage,
  },
};
