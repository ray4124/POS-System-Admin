import Dexie, { Table } from "dexie";

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Super Admin" | "Admin" | "Staff";
  branch_id: number | null;
  passwordHash?: string; // keep bcrypt hash
  modified_at: string;
}

class StaffDB extends Dexie {
  staffs!: Table<Staff, number>;

  constructor() {
    super("StaffDatabase");
    this.version(1).stores({
      staffs: "id, email, modified_at", // primary key id
    });
  }
}

export const staffDB = new StaffDB();

export const syncStaffs = async () => {
  try {
    const res = await fetch("http://localhost:5000/employees/staffs");
    const staffs = await res.json();

    await staffDB.staffs.clear();
    await staffDB.staffs.bulkAdd(
      staffs.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        branch_id: s.branch_id,
        passwordHash: s.password, // bcrypt hash from backend
        modified_at: s.modified_at || new Date().toISOString(),
      }))
    );

    console.log("✅ Staff synced to IndexedDB");
  } catch (err) {
    console.error("❌ Failed to sync staff:", err);
  }
};