import type { Budgets, Category, CategoryId, Transaction } from './types';

export const categories: Record<CategoryId, Category> = {
  food: { id: 'food', label: 'Food', icon: 'restaurant-outline' },
  transport: { id: 'transport', label: 'Transport', icon: 'car-outline' },
  shopping: { id: 'shopping', label: 'Shopping', icon: 'bag-outline' },
  bills: { id: 'bills', label: 'Bills', icon: 'flash-outline' },
  fun: { id: 'fun', label: 'Fun', icon: 'game-controller-outline' },
  income: { id: 'income', label: 'Income', icon: 'arrow-down-circle-outline' },
};

export const expenseCategories = (['food', 'transport', 'shopping', 'bills', 'fun'] as const).map(
  (id) => categories[id],
);

export const initialBudgets: Budgets = {
  food: 450,
  transport: 150,
  shopping: 300,
  bills: 900,
  fun: 200,
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const initialTransactions: Transaction[] = [
  { id: '1', title: 'Salary', amount: 4200, category: 'income', date: daysAgo(6) },
  { id: '2', title: 'Rent', amount: -850, category: 'bills', date: daysAgo(5) },
  { id: '3', title: 'Whole Foods', amount: -86.4, category: 'food', date: daysAgo(4) },
  { id: '4', title: 'Metro pass', amount: -64, category: 'transport', date: daysAgo(3) },
  { id: '5', title: 'Sneakers', amount: -139.99, category: 'shopping', date: daysAgo(2) },
  { id: '6', title: 'Cinema', amount: -24, category: 'fun', date: daysAgo(1) },
  { id: '7', title: 'Coffee', amount: -4.8, category: 'food', date: daysAgo(0) },
];
