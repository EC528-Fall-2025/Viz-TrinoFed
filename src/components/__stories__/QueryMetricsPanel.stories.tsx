import type { Meta, StoryObj } from '@storybook/react';
import QueryMetricsPanel from '../QueryMetricsPanel';
import { sampleQueryTree } from './fixtures';

const meta: Meta<typeof QueryMetricsPanel> = {
  title: 'Components/QueryMetricsPanel',
  component: QueryMetricsPanel,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', backgroundColor: '#f1f3f5' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    query: sampleQueryTree,
  },
};

export default meta;

type Story = StoryObj<typeof QueryMetricsPanel>;

export const Default: Story = {};

