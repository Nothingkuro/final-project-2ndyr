import '../src/index.css';
import type { Preview } from '@storybook/react-vite'
import {
  installStorybookApiMock,
  resetStorybookApiMockState,
} from '../src/stories/mocks/storybookMockApi';

installStorybookApiMock();

const preview: Preview = {
  decorators: [
    (Story) => {
      resetStorybookApiMockState();
      return Story();
    },
  ],
  parameters: {
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },

    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#F3F3F2' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#171717' },
      ],
    },

    viewport: {
      defaultViewport: 'responsive',
      viewports: {
        mobile375: {
          name: 'Mobile (375px)',
          styles: {
            width: '375px',
            height: '812px',
          },
          type: 'mobile',
        },
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;