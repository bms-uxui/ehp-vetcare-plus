import { mockProducts, Product } from './products';

export type OrderStatus =
  | 'placed'
  | 'packing'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  productId: string;
  qty: number;
  unitPriceBaht: number;
};

export type Order = {
  id: string;
  placedAtISO: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingFeeBaht: number;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryISO?: string;
  deliveredAtISO?: string;
};

export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; icon: string; color: string; bg: string }
> = {
  placed: {
    label: 'รับคำสั่งซื้อแล้ว',
    icon: 'Receipt',
    color: '#6E8FAE',
    bg: '#EAF1F7',
  },
  packing: {
    label: 'กำลังเตรียมสินค้า',
    icon: 'Package',
    color: '#C97A3F',
    bg: '#FBEFE2',
  },
  shipping: {
    label: 'กำลังจัดส่ง',
    icon: 'Truck',
    color: '#3B7BB5',
    bg: '#E5EFF8',
  },
  delivered: {
    label: 'จัดส่งสำเร็จ',
    icon: 'PackageCheck',
    color: '#2E8049',
    bg: '#E7F5E9',
  },
  cancelled: {
    label: 'ยกเลิกแล้ว',
    icon: 'XCircle',
    color: '#A63A35',
    bg: '#FBE8E7',
  },
};

// Linear progression used by the tracking timeline. Cancelled is rendered
// separately and does not appear in this array.
export const orderProgressSteps: OrderStatus[] = [
  'placed',
  'packing',
  'shipping',
  'delivered',
];

const findProduct = (id: string) =>
  mockProducts.find((p) => p.id === id) ?? mockProducts[0];

export const getOrderProducts = (
  order: Order,
): { product: Product; qty: number; unitPriceBaht: number }[] =>
  order.items.map((item) => ({
    product: findProduct(item.productId),
    qty: item.qty,
    unitPriceBaht: item.unitPriceBaht,
  }));

export const orderSubtotal = (order: Order) =>
  order.items.reduce((sum, i) => sum + i.unitPriceBaht * i.qty, 0);

export const orderTotal = (order: Order) =>
  orderSubtotal(order) + order.shippingFeeBaht;

const dayOffset = (days: number, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// 4 mock orders covering the main statuses. Product IDs reference
// existing entries in `mockProducts` — keep these in sync if products
// are renamed/removed.
export const mockOrders: Order[] = [
  {
    id: 'EHP-2026-0428-001',
    placedAtISO: dayOffset(0, 9, 12),
    status: 'packing',
    items: [
      {
        productId: mockProducts[0]?.id ?? 'p-1',
        qty: 1,
        unitPriceBaht: mockProducts[0]?.priceBaht ?? 1850,
      },
      {
        productId: mockProducts[1]?.id ?? 'p-2',
        qty: 2,
        unitPriceBaht: mockProducts[1]?.priceBaht ?? 420,
      },
    ],
    shippingFeeBaht: 0,
    estimatedDeliveryISO: dayOffset(2, 14, 0),
  },
  {
    id: 'EHP-2026-0426-014',
    placedAtISO: dayOffset(-2, 16, 30),
    status: 'shipping',
    items: [
      {
        productId: mockProducts[2]?.id ?? 'p-3',
        qty: 1,
        unitPriceBaht: mockProducts[2]?.priceBaht ?? 780,
      },
    ],
    shippingFeeBaht: 0,
    trackingNumber: 'TH62300472841',
    carrier: 'Kerry Express',
    estimatedDeliveryISO: dayOffset(1, 12, 0),
  },
  {
    id: 'EHP-2026-0420-007',
    placedAtISO: dayOffset(-8, 11, 5),
    status: 'delivered',
    items: [
      {
        productId: mockProducts[3]?.id ?? 'p-4',
        qty: 1,
        unitPriceBaht: mockProducts[3]?.priceBaht ?? 540,
      },
      {
        productId: mockProducts[4]?.id ?? 'p-5',
        qty: 1,
        unitPriceBaht: mockProducts[4]?.priceBaht ?? 320,
      },
    ],
    shippingFeeBaht: 0,
    trackingNumber: 'TH62300441120',
    carrier: 'Flash Express',
    deliveredAtISO: dayOffset(-6, 15, 40),
  },
  {
    id: 'EHP-2026-0415-022',
    placedAtISO: dayOffset(-13, 19, 50),
    status: 'cancelled',
    items: [
      {
        productId: mockProducts[5]?.id ?? 'p-6',
        qty: 1,
        unitPriceBaht: mockProducts[5]?.priceBaht ?? 1200,
      },
    ],
    shippingFeeBaht: 0,
  },
];

export const fmtOrderDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

export const fmtOrderDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
