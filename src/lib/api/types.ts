export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* ── Auth ── */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/* ── Dashboard ── */
export interface DashboardData {
  totalCases: number;
  registeredCases: number;
  inProgressCases: number;
  declaredCases: number;
  acceptedCases: number;
  arrivalConfirmedCases: number;
  completedCases: number;
  cancelledCases: number;
  totalClients: number;
  unpaidCases: number;
}

/* ── Client ── */
export interface Client {
  id: number;
  companyName: string;
  representativeName: string;
  businessNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  memo: string;
  active: boolean;
  createdAt: string;
}

export interface CreateClientRequest {
  companyName: string;
  representativeName: string;
  businessNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  memo?: string;
}

export interface UpdateClientRequest {
  companyName?: string;
  representativeName?: string;
  businessNumber?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  memo?: string;
}

/* ── Case ── */
export type CaseStatus =
  | "REGISTERED"
  | "IN_PROGRESS"
  | "CUSTOMS_DECLARED"
  | "CUSTOMS_ACCEPTED"
  | "ARRIVAL_CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "OVERDUE";

export type ShippingMethod = "SEA" | "AIR" | "LAND" | "COURIER";

export interface Cargo {
  id: number;
  itemName: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  originCountry: string;
}

export interface BrokerCase {
  id: number;
  caseNumber: string;
  clientId: number;
  clientName: string;
  status: CaseStatus;
  paymentStatus: PaymentStatus;
  shippingMethod: ShippingMethod;
  blNumber: string;
  etaDate: string;
  ataDate: string;
  customsDate: string;
  releaseDate: string;
  departurePorts: string;
  arrivalPort: string;
  totalAmount: number;
  dutyAmount: number;
  vatAmount: number;
  brokerageFee: number;
  memo: string;
  assigneeId: number;
  cargos: Cargo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseRequest {
  caseNumber: string;
  clientId: number;
  shippingMethod: ShippingMethod;
  blNumber?: string;
  etaDate?: string;
  departurePorts?: string;
  arrivalPort?: string;
  totalAmount?: number;
  memo?: string;
  assigneeId?: number;
}

export interface UpdateCaseRequest {
  status?: CaseStatus;
  paymentStatus?: PaymentStatus;
  shippingMethod?: ShippingMethod;
  blNumber?: string;
  etaDate?: string;
  ataDate?: string;
  customsDate?: string;
  releaseDate?: string;
  departurePorts?: string;
  arrivalPort?: string;
  totalAmount?: number;
  dutyAmount?: number;
  vatAmount?: number;
  brokerageFee?: number;
  memo?: string;
  assigneeId?: number;
}

export interface CreateCargoRequest {
  itemName: string;
  hsCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  originCountry: string;
}

/* ── User ── */
export interface MyPageData {
  userId: number;
  email: string;
  role: "MASTER" | "ADMIN" | "STAFF";
  active: boolean;
  companyId: number;
}

export interface StaffData {
  id: number;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface CreateStaffRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
