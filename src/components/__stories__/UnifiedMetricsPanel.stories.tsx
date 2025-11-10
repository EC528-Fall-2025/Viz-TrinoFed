import type { Meta, StoryObj } from '@storybook/react';
import UnifiedMetricsPanel from '../UnifiedMetricsPanel';
import { sampleQueryTreeWithStats, sampleQueryNode } from './fixtures';

const meta: Meta<typeof UnifiedMetricsPanel> = {
  title: 'Components/UnifiedMetricsPanel',
  component: UnifiedMetricsPanel,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: '700px', backgroundColor: '#f1f3f5', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    query: sampleQueryTreeWithStats,
    activeFragment: sampleQueryNode,
    isOpen: true,
    onClose: () => undefined,
    onOpen: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof UnifiedMetricsPanel>;

export const Default: Story = {};

