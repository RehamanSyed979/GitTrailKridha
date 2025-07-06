
// Backend API base URL (dynamic for local/dev/prod)
// Set API base URL for both local and production
const PROD_HOSTNAMES = ['git-trail-kridha.vercel.app']; // add more if needed
let API_BASE = '';
if (PROD_HOSTNAMES.includes(window.location.hostname)) {
  API_BASE = 'https://13.203.78.106/api';
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  API_BASE = 'http://localhost:3000/api';
} else {
  // fallback: use production API for any other deployed domain
  API_BASE = 'https://13.203.78.106/api';
}

async function registerUser(mobile, email, password, name) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, email, password, name })
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
