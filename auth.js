
// Backend API base URL
const API_BASE = 'http://localhost:3000/api';

async function registerUser(email, password, name) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  return res.ok;
}

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

async function getAllUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) return [];
  return await res.json();
}

async function setUserRole(email, role) {
  const res = await fetch(`${API_BASE}/setrole`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  });
  return res.ok;
}

async function deleteUser(email) {
  const res = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.ok;
}

window.kridhaAuth = {
  registerUser,
  loginUser,
  getAllUsers,
  setUserRole,
  deleteUser
};
