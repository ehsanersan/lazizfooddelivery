// انواع داده‌های اصلی پروژه لذیذ

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  centerLat: number;
  centerLng: number;
  serviceType: 'circle' | 'polygon';
  radiusMeters: number;
  polygonCoords: [number, number][];
  color: string;
  fillOpacity: number;
  workingHours: string;
  isActive: boolean;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
}

export type AppView = 'client' | 'admin-login' | 'admin-dashboard';

export interface SearchResult {
  lat: number;
  lng: number;
  displayName: string;
  branch: Branch | null;
  isInCoverage: boolean;
}

export interface RouteInfo {
  coordinates: [number, number][];
  distance: number; // km
  duration: number; // minutes
}
