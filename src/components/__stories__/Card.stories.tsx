import type { Meta, StoryObj } from '@storybook/react';
import BasicCard, { CardProps } from '../Card';
import { sampleCards } from './fixtures';

const meta: Meta<typeof BasicCard> = {
  title: 'Components/Card',
  component: BasicCard,
  args: sampleCards[0],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof BasicCard>;

export const Finished: Story = {
  args: sampleCards[0],
};

export const Failed: Story = {
  args: {
    ...sampleCards[1],
    status: 'failed',
  } satisfies CardProps,
};

export const Idle: Story = {
  args: {
    ...sampleCards[2],
    status: 'idle',
  } satisfies CardProps,
};

