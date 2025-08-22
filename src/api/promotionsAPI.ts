import axios from "axios"

// API instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false,
})

// ---------- Types ----------
export interface Promotion {
  id: string
  name: string
  description: string
  type: "percentage" | "fixed" | "bogo"
  value: number
  start_date: string
  end_date: string
  start_time_frame: string | null
  end_time_frame: string | null
  minimum_spend: number | null
  minimum_item: number | null
  products: number[]
}

// ---------- API Calls ----------

// Get all promotions
export const getPromotions = async (): Promise<Promotion[]> => {
  const res = await api.get<Promotion[]>("/promotions")
  return res.data
}

// Create new promotion
export const createPromotion = async (promotion: Omit<Promotion, "id">) => {
  const res = await api.post("/promotions", promotion)
  return res.data
}

// Update promotion
export const updatePromotion = async (id: string, promotion: Omit<Promotion, "id">) => {
  const res = await api.put(`/promotions/${id}`, promotion)
  return res.data
}

// Delete promotion
export const deletePromotion = async (id: string) => {
  const res = await api.delete(`/promotions/${id}`)
  return res.data
}
