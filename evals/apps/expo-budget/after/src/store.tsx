import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { initialBudgets, initialTransactions } from './data';
import type { Budgets, CategoryId, Transaction } from './types';

interface Store {
  transactions: Transaction[];
  budgets: Budgets;
  balance: number;
  income: number;
  expenses: number;
  spentByCategory: Record<string, number>;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  setBudget: (id: keyof Budgets, amount: number) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budgets>(initialBudgets);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'date'>) => {
    setTransactions((prev) => [
      { ...t, id: String(Date.now()), date: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const setBudget = useCallback((id: keyof Budgets, amount: number) => {
    setBudgets((prev) => ({ ...prev, [id]: Math.max(0, amount) }));
  }, []);

  const value = useMemo<Store>(() => {
    const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
    const spentByCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount < 0) {
        spentByCategory[t.category as CategoryId] =
          (spentByCategory[t.category] ?? 0) - t.amount;
      }
    }
    return {
      transactions,
      budgets,
      balance: income - expenses,
      income,
      expenses,
      spentByCategory,
      addTransaction,
      setBudget,
    };
  }, [transactions, budgets, addTransaction, setBudget]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
