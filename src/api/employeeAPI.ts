import axios from "axios";

// Define your API instance
const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: false,
});

// ---------- Types ----------
export interface Employee {
    id: number
    name: string
    email: string
    role: 'Owner' | 'Super Admin' | 'Admin' | 'Staff'
    branch_id: number | null
}

// ---------- API Calls ----------

export const getEmployees = async (): Promise<Employee[]> => {
    const res = await api.get<Employee[]>("/employees");
    return res.data;
}

export const createEmployee = async (Employee: Omit<Employee, "id">) => {
    const res = await api.post("/employees", Employee);
    return res.data
}

export const updateEmployee = async (id: string, Employee: Omit<Employee, "id">) => {
    const res = await api.put(`/employees/${id}`, Employee);
    return res.data
}

export const deleteEmployee = async (id: string) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data
}

export const login = async (email: string, password: string) => {
    const res = await api.post('/employees/login', { email, password })
    return res.data as Employee
}