import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Expense, mockExpenses } from './expenses';

type ExpensesContextValue = {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

let counter = 0;
const makeId = () => {
  counter += 1;
  return `e-${Date.now().toString(36)}-${counter}`;
};

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => [...mockExpenses]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const created: Expense = { ...expense, id: makeId() };
    setExpenses((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateExpense = useCallback(
    (id: string, patch: Partial<Omit<Expense, 'id'>>) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo<ExpensesContextValue>(
    () => ({ expenses, addExpense, updateExpense, removeExpense }),
    [expenses, addExpense, updateExpense, removeExpense],
  );

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}
