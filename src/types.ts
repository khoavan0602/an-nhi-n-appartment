export interface Building {
  id: string;
  name: string;
  address: string;
  description: string;
}

export interface Room {
  id: string;
  buildingId: string;
  name: string;
  basePrice: number;
  status: 'empty' | 'occupied';
}

export interface Tenant {
  id: string;
  roomId: string;
  name: string;
  phone: string;
  idNumber: string;
  temporaryResidenceStatus: boolean; // Đăng ký tạm trú
}

export interface MeterReading {
  id: string;
  roomId: string;
  month: number; // 1-12
  year: number;
  powerOld: number;
  powerNew: number;
  waterOld: number;
  waterNew: number;
  extraPrice: number; // Phụ phí khác
  extraNotes: string; // Ghi chú phụ phí
}

export type ExpenseCategory =
  | 'Sửa chữa & Bảo trì'
  | 'Điện nước chung'
  | 'Mua sắm thiết bị'
  | 'Thuế & Phí quản lý'
  | 'Internet & Vệ sinh'
  | 'Khác';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  buildingId: string | null;
  roomId: string | null;
}

export interface Contract {
  id: string;
  roomId: string;
  tenantId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  deposit: number;
  rentPrice: number;
  // Billing Rules & Monthly Fixed Service configurations
  numberOfOccupants?: number;      // Số người ở
  electricityPrice?: number;       // Đơn giá điện (đ/kWh)
  waterPrice?: number;             // Đơn giá nước
  waterType?: 'PER_PERSON' | 'PER_CUBIC'; // Loại tính tiền nước (đầu người hoặc theo khối)
  machineWashingPrice?: number;    // Phí máy giặt/tháng
  internetPrice?: number;          // Phí mạng/tháng
  parkingPrice?: number;           // Phí xe/tháng
}

export interface Invoice {
  id: string;
  roomId: string;
  month: number;
  year: number;
  rentPrice: number;
  powerPrice: number;
  waterPrice: number;
  extraPrice: number;
  discountPrice: number;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'paid' | 'partially_paid';
  paymentDate: string | null;
  notes: string;
  // Snapshot of billing rules applied to this historical invoice
  numberOfOccupants?: number;
  electricityPrice?: number;
  waterPriceUnit?: number; // Rename to avoid confusion with the calculated waterPrice
  waterType?: 'PER_PERSON' | 'PER_CUBIC';
  machineWashingPrice?: number;
  internetPrice?: number;
  parkingPrice?: number;
}

// Global prices for service calculation
export const SERVICE_PRICES = {
  powerUnitPrice: 3800, // 3.800đ / kWh
  waterUnitPrice: 25000, // 25.000đ / m3 (hoặc bình quân người)
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount).replace(/\s?₫/g, 'đ');
}

