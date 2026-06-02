// مدیریت داده‌ها با localStorage - شبیه‌سازی بک‌اند
import type { Branch, AdminUser, AuthState } from './types';

const BRANCHES_KEY = 'laziz_branches_v3';
const AUTH_KEY = 'laziz_auth';
const ADMIN_KEY = 'laziz_admin';

// داده‌های شعب لذیذ در بندرعباس
const SEED_BRANCHES: Branch[] = [
  {
    id: 'branch-resalat',
    name: 'شعبه رسالت',
    address: 'رسالت شمالی نبش کوچه فرخی، مجموعه غذایی لذیذ',
    phone: '076-3204',
    centerLat: 27.1932,
    centerLng: 56.2821,
    serviceType: 'circle',
    radiusMeters: 2000,
    polygonCoords: [],
    color: '#7C3AED',
    fillOpacity: 0.25,
    workingHours: '11:00 - 23:00',
    isActive: true,
  },
  {
    id: 'branch-azadegan',
    name: 'شعبه آزادگان',
    address: 'انتهای آزادگان، روبروی شیرینی پاک، مجموعه غذایی لذیذ',
    phone: '076-3204',
    centerLat: 27.1785,
    centerLng: 56.2534,
    serviceType: 'circle',
    radiusMeters: 2000,
    polygonCoords: [],
    color: '#7C3AED',
    fillOpacity: 0.25,
    workingHours: '11:00 - 23:00',
    isActive: true,
  },
  {
    id: 'branch-delgosha',
    name: 'شعبه دلگشا',
    address: 'سه راه دلگشا، جنب کلانتری بازار، مجموعه غذایی لذیذ',
    phone: '076-3204',
    centerLat: 27.1889,
    centerLng: 56.2678,
    serviceType: 'circle',
    radiusMeters: 2000,
    polygonCoords: [],
    color: '#7C3AED',
    fillOpacity: 0.25,
    workingHours: '11:00 - 23:00',
    isActive: true,
  },
];

// ادمین پیش‌فرض
const DEFAULT_ADMIN: AdminUser = {
  username: 'admin',
  passwordHash: 'admin123',
};

// --- توابع مدیریت شعب ---

export function getBranches(): Branch[] {
  const data = localStorage.getItem(BRANCHES_KEY);
  if (!data) {
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(SEED_BRANCHES));
    return SEED_BRANCHES;
  }
  return JSON.parse(data);
}

export function saveBranches(branches: Branch[]): void {
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
}

export function addBranch(branch: Branch): Branch[] {
  const branches = getBranches();
  branches.push(branch);
  saveBranches(branches);
  return branches;
}

export function updateBranch(updated: Branch): Branch[] {
  let branches = getBranches();
  branches = branches.map(b => (b.id === updated.id ? updated : b));
  saveBranches(branches);
  return branches;
}

export function deleteBranch(id: string): Branch[] {
  let branches = getBranches();
  branches = branches.filter(b => b.id !== id);
  saveBranches(branches);
  return branches;
}

// --- توابع احراز هویت ---

export function getAdmin(): AdminUser {
  const data = localStorage.getItem(ADMIN_KEY);
  if (!data) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(DEFAULT_ADMIN));
    return DEFAULT_ADMIN;
  }
  return JSON.parse(data);
}

export function login(username: string, password: string): AuthState {
  const admin = getAdmin();
  if (username === admin.username && password === admin.passwordHash) {
    const token = btoa(`${username}:${Date.now()}`);
    const auth: AuthState = {
      isAuthenticated: true,
      token,
      username,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return auth;
  }
  return { isAuthenticated: false, token: null, username: null };
}

export function getAuth(): AuthState {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return { isAuthenticated: false, token: null, username: null };
  return JSON.parse(data);
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function resetData(): void {
  localStorage.removeItem(BRANCHES_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
