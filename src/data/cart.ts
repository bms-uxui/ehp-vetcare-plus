import { useEffect, useState } from 'react';
import { Product } from './products';

export type CartItem = {
  product: Product;
  qty: number;
  subscribe: boolean;
};

// Module-level state — simple singleton. Survives navigation within a session.
let items: CartItem[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export const cartStore = {
  getItems: () => items,
  add: (p: Product, subscribe = false) => {
    const existing = items.find((i) => i.product.id === p.id);
    if (existing) {
      existing.qty += 1;
      if (subscribe) existing.subscribe = true;
      items = [...items];
    } else {
      items = [...items, { product: p, qty: 1, subscribe }];
    }
    notify();
  },
  setQty: (productId: string, qty: number) => {
    if (qty <= 0) {
      items = items.filter((i) => i.product.id !== productId);
    } else {
      items = items.map((i) => (i.product.id === productId ? { ...i, qty } : i));
    }
    notify();
  },
  toggleSubscribe: (productId: string) => {
    items = items.map((i) =>
      i.product.id === productId ? { ...i, subscribe: !i.subscribe } : i,
    );
    notify();
  },
  clear: () => {
    items = [];
    notify();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useCart = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => force((n) => n + 1));
    return () => {
      unsubscribe();
    };
  }, []);
  return {
    items: cartStore.getItems(),
    add: cartStore.add,
    setQty: cartStore.setQty,
    toggleSubscribe: cartStore.toggleSubscribe,
    clear: cartStore.clear,
    count: cartStore.getItems().reduce((sum, i) => sum + i.qty, 0),
    subtotal: cartStore.getItems().reduce((sum, i) => {
      const discount = i.subscribe && i.product.subscriptionDiscountPct
        ? (i.product.priceBaht * i.product.subscriptionDiscountPct) / 100
        : 0;
      return sum + (i.product.priceBaht - discount) * i.qty;
    }, 0),
  };
};
