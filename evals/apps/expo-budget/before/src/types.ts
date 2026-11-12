import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type CategoryId = 'food' | 'transport' | 'shopping' | 'bills' | 'fun' | 'income';

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconName;
  color: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // positive = income, negative = expense
  category: CategoryId;
  date: string; // ISO
}

export type Budgets = Record<Exclude<CategoryId, 'income'>, number>;
