import type { Meta, StoryObj } from '@storybook/react';
import CardList from '../CardList';
import { sampleCards } from './fixtures';

const meta: Meta<typeof CardList> = {
  title: 'Components/CardList',
  component: CardList,
  args: {
    cards: sampleCards,
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof CardList>;

export const Default: Story = {};

