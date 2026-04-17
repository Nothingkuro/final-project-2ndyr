import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SearchBar from '../../../../components/common/SearchBar';

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Common/Search Bar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
  args: {
    onChange: () => {},
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchBarPlayground(args: ComponentProps<typeof SearchBar>) {
  const [value, setValue] = useState(args.value ?? '');

  return (
    <div className="w-[320px]">
      <SearchBar {...args} value={value} onChange={setValue} />
    </div>
  );
}

export const MobileDefault: Story = {
  args: {
    value: '',
    placeholder: 'Search member...',
    inputClassName: 'bg-surface border-neutral-300 text-secondary placeholder:text-neutral-400',
  },
  render: (args) => <SearchBarPlayground {...args} />,
};

export const MobilePrefilled: Story = {
  args: {
    value: 'john doe',
    placeholder: 'Search member...',
    inputClassName: 'bg-surface border-neutral-300 text-secondary placeholder:text-neutral-400',
  },
  render: (args) => <SearchBarPlayground {...args} />,
};
