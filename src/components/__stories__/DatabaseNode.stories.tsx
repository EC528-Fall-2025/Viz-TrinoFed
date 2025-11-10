import type { Meta, StoryObj } from '@storybook/react';
import DatabaseNode from '../DatabaseNode';
import { sampleDatabase } from './fixtures';

const meta: Meta<typeof DatabaseNode> = {
  title: 'Components/DatabaseNode',
  component: DatabaseNode,
  args: {
    data: {
      ...sampleDatabase,
      label: sampleDatabase.name,
    },
  },
};

export default meta;

type Story = StoryObj<typeof DatabaseNode>;

export const Active: Story = {};

export const MongoDatabase: Story = {
  args: {
    data: {
      ...sampleDatabase,
      id: 'mongodb',
      name: 'MongoDB',
      type: 'mongodb',
      status: 'ACTIVE',
      label: 'MongoDB',
    },
  },
};

