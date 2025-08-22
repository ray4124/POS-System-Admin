import axios from "axios";

// Define your API instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false,
});

// ---------- Types ----------
export interface Branch {
  id: number;
  branch_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: number;
  brand_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface BranchBrand {
  id: number;
  branch_id: number;
  brand_id: number;
}

export interface Transaction {
  id: number;
  promotion_id?: number | null;
  payment_method: "Cash" | "E-Wallet";
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  status: "Pending" | "Completed" | "Cancelled" | "Refunded";
  created_at: string;
}

export interface TransactionProduct {
  transaction_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
}

// ---------- API Calls ----------

// Branches
export const getBranches = async (): Promise<Branch[]> => {
  const res = await api.get<Branch[]>("/branches");
  return res.data;
};

// Brands
export const getBrands = async (): Promise<Brand[]> => {
  const res = await api.get<Brand[]>("/brands");
  return res.data;
};

// Branch-Brand Relations
export const getBranchBrands = async (): Promise<BranchBrand[]> => {
  const res = await api.get<BranchBrand[]>("/branch-brand");
  return res.data;
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const res = await api.get<Transaction[]>("/transactions");
  return res.data;
};

// Transaction Products
export const getTransactionProducts = async (): Promise<TransactionProduct[]> => {
  const res = await api.get<TransactionProduct[]>("/transaction-products");
  return res.data;
};
