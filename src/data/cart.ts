import { useEffect, useState } from 'react';
import { mockProducts, Product } from './products';

export type CartItem = {
  product: Product;
  qty: number;
  subscribe: boolean;
};

// Demo seed: pre-populate the cart with 5 sample items so the screen
// shows realistic content on first load. Remove or guard with a dev flag
// once real cart persistence (AsyncStorage / API) is in place.
const seedCart = (): CartItem[] => {
  const seedIds: Array<{ id: string; qty: number; subscribe: boolean }> = [
    { id: 'pr1', qty: 2, subscribe: true },  // Hill's hypoallergenic — subscriber
    { id: 'pr2', qty: 1, subscribe: false }, // Royal Canin
    { id: 'pr4', qty: 3, subscribe: false }, // Dental chews
    { id: 'pr8', qty: 1, subscribe: false }, // Chlorhexidine shampoo
    { id: 'pr9', qty: 1, subscribe: true },  // Frontline — subscriber
  ];
  return seedIds
    .map(({ id, qty, subscribe }) => {
      const product = mockProducts.find((p) => p.id === id);
      return product ? { product, qty, subscribe } : null;
    })
    .filter((x): x is CartItem => x !== null);
};

// Module-level state — simple singleton. Survives navigation within a session.
let items: CartItem[] = seedCart();
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
