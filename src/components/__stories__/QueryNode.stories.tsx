import type { Meta, StoryObj } from '@storybook/react';
import { QueryNode } from '../Node';
import { sampleQueryNode } from './fixtures';

const meta: Meta<typeof QueryNode> = {
  title: 'Components/QueryNode',
  component: QueryNode,
  args: sampleQueryNode,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof QueryNode>;

export const Default: Story = {};

