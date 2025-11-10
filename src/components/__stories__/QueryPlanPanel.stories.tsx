import type { Meta, StoryObj } from '@storybook/react';
import QueryPlanPanel from '../QueryPlanPanel';
import { sampleQueryTree, samplePlanText } from './fixtures';

const meta: Meta<typeof QueryPlanPanel> = {
  title: 'Components/QueryPlanPanel',
  component: QueryPlanPanel,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    events: sampleQueryTree.events,
    plan: samplePlanText,
  },
};

export default meta;

type Story = StoryObj<typeof QueryPlanPanel>;

export const Default: Story = {};

export const EventsOnly: Story = {
  args: {
    plan: undefined,
  },
};

