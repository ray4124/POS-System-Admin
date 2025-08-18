// generateEmployee.js
import fs from "fs";

const branches = [
  { id: 1, name: "Main - Makati Branch" },
  { id: 2, name: "BGC Branch" },
  { id: 3, name: "Ortigas Branch" },
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  const firstNames = ["Juan", "Maria", "Pedro", "Ana", "Jose", "Carmen", "Luis", "Rosa", "Mark", "Liza"];
  const lastNames = ["Santos", "Reyes", "Cruz", "Garcia", "Mendoza", "Flores", "Torres", "Villanueva"];
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function generateEmployees() {
  const employees = [];
  let id = 1;

  // Owner (1 only)
  employees.push({
    id: id++,
    role: "Owner",
    branch: null,
    name: "System Owner",
    email: "owner@example.com",
    password: "password123",
  });

  // Super Admin (1 only)
  employees.push({
    id: id++,
    role: "Super Admin",
    branch: null,
    name: "System SuperAdmin",
    email: "superadmin@example.com",
    password: "password123",
  });

  // Admins: 1 per branch
  branches.forEach(branch => {
    const name = randomName();
    employees.push({
      id: id++,
      role: "Admin",
      branch: branch.name,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}${id}@example.com`,
      password: "password123",
    });
  });

  // Staff: 2–4 per branch
  branches.forEach(branch => {
    const staffCount = Math.floor(Math.random() * 3) + 2; // 2–4
    for (let i = 0; i < staffCount; i++) {
      const name = randomName();
      employees.push({
        id: id++,
        role: "Staff",
        branch: branch.name,
        name,
        email: `${name.toLowerCase().replace(" ", ".")}${id}@example.com`,
        password: "password123",
      });
    }
  });

  return employees;
}

const employees = generateEmployees();

fs.writeFileSync("employees.json", JSON.stringify(employees, null, 2), "utf-8");
console.log("✅ employees.json generated with", employees.length, "employees");
