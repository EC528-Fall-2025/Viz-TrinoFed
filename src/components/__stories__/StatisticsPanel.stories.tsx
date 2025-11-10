import type { Meta, StoryObj } from '@storybook/react';
import StatisticsPanel from '../StatisticsPanel';
import { sampleQueryTreeWithStats } from './fixtures';

const meta: Meta<typeof StatisticsPanel> = {
  title: 'Components/StatisticsPanel',
  component: StatisticsPanel,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', backgroundColor: '#f1f3f5', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    query: sampleQueryTreeWithStats,
  },
};

export default meta;

type Story = StoryObj<typeof StatisticsPanel>;

export const Default: Story = {};

