import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FilterDropdown from '../../../../components/common/FilterDropdown';

const options = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile375',
  },
};

const meta = {
  title: 'Mobile Views/Components/Common/Filter Dropdown',
  component: FilterDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...mobileViewport,
  },
} satisfies Meta<typeof FilterDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

function FilterDropdownPlayground(args: ComponentProps<typeof FilterDropdown>) {
  const [isOpen, setIsOpen] = useState(args.isOpen ?? false);
  const [activeOption, setActiveOption] = useState(args.activeOption ?? 'ALL');

  return (
    <FilterDropdown
      {...args}
      isOpen={isOpen}
      activeOption={activeOption}
      onToggle={() => setIsOpen((prev) => !prev)}
      onSelect={(value) => {
        setActiveOption(value);
        setIsOpen(false);
      }}
    />
  );
}

export const MobileClosed: Story = {
  args: {
    label: 'Filter',
    options,
    activeOption: 'ALL',
    isOpen: false,
    onToggle: () => {},
    onSelect: () => {},
  },
  render: (args) => <FilterDropdownPlayground {...args} />,
};

export const MobileOpenWithSelectedOption: Story = {
  args: {
    label: 'Filter',
    options,
    activeOption: 'EXPIRED',
    isOpen: true,
    onToggle: () => {},
    onSelect: () => {},
  },
  render: (args) => <FilterDropdownPlayground {...args} />,
};
