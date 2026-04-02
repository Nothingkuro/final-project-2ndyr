import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';
import Header from '../../components/layout/Header';

const meta = {
  title: 'App/Layouts/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onMenuToggle: fn(),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopWithNotifications: Story = {
  args: {
    showNotificationDot: true,
  },
};

export const WithoutNotificationDot: Story = {
  args: {
    showNotificationDot: false,
  },
};

export const BlankWidgetOnNotificationPress: Story = {
  args: {
    showNotificationDot: true,
    notificationWidget: <div className="h-24" aria-label="Blank notification widget" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Notifications'));
  },
};
