import axios from "axios";

// Define your API instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false,
});

// ---------- Types ----------
export interface Product {
  id: number;
  product_name: string;
  branch_brand_id: number;
  category: string;
  price: number;
  stock: number;
  alert_at: number;
  is_active: boolean;
  picture?: string;
}

// ---------- API Calls ----------

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get<Product[]>("/products");
  return res.data;
};

export const createProduct = async (product: FormData): Promise<Product> => {
  const res = await api.post<Product>("/products", product, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateProduct = async (id: number, product: FormData): Promise<Product> => {
  const res = await api.put<Product>(`/products/${id}`, product, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const stockProduct = async (id: number, stock: number): Promise<void> => {
  await api.put(`/products/stock/${id}`, { stock });
};

export const statusProduct = async (id: number, isActive: boolean): Promise<void> => {
  await api.put(`/products/status/${id}`, { isActive });
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};