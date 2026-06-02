// ابزارهای جغرافیایی - محاسبه فاصله و تشخیص محدوده

import type { Branch } from '../types';

const EARTH_RADIUS = 6371000; // شعاع زمین بر حسب متر

// ثابت‌های محدوده (بر حسب کیلومتر مسیریابی)
export const ZONE_NEAR_LIMIT = 2;    // تا ۲ کیلومتر مسیر
export const ZONE_FAR_LIMIT = 4;     // تا ۴ کیلومتر مسیر

export type ZoneType = 'near' | 'far' | 'out';

/**
 * محاسبه فاصله هاورساین بین دو نقطه (خط مستقیم)
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}

/**
 * تشخیص نوع محدوده بر اساس فاصله مسیریابی (کیلومتر)
 */
export function getZoneType(routeDistanceKm: number): ZoneType {
  if (routeDistanceKm <= ZONE_NEAR_LIMIT) return 'near';
  if (routeDistanceKm <= ZONE_FAR_LIMIT) return 'far';
  return 'out';
}

/**
 * دریافت اطلاعات محدوده
 */
export function getZoneInfo(zone: ZoneType): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: string;
  deliveryNote: string;
} {
  switch (zone) {
    case 'near':
      return {
        label: 'مسیر نزدیک',
        color: '#22C55E',
        bgColor: 'bg-green-500',
        description: 'فاصله مسیریابی کمتر از ۲ کیلومتر',
        icon: '✅',
        deliveryNote: 'ارسال سریع - زمان تقریبی ۱۵ تا ۲۵ دقیقه',
      };
    case 'far':
      return {
        label: 'مسیر دور',
        color: '#F59E0B',
        bgColor: 'bg-yellow-500',
        description: 'فاصله مسیریابی ۲ تا ۴ کیلومتر',
        icon: '⚠️',
        deliveryNote: 'ارسال با کمی تأخیر - زمان تقریبی ۲۵ تا ۴۰ دقیقه',
      };
    case 'out':
      return {
        label: 'خارج از محدوده معمول',
        color: '#EF4444',
        bgColor: 'bg-red-500',
        description: 'فاصله مسیریابی بیش از ۴ کیلومتر',
        icon: '🚗',
        deliveryNote: 'قابل ارسال از نزدیک‌ترین شعبه - زمان تقریبی ۴۰ تا ۶۰ دقیقه',
      };
  }
}

/**
 * تشخیص اینکه یک نقطه داخل چندضلعی است یا خیر
 * Ray-casting algorithm
 */
export function pointInPolygon(
  lat: number, lng: number,
  polygon: [number, number][]
): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * بررسی اینکه نقطه در محدوده شعبه است (دایره یا چندضلعی)
 */
export function isPointInBranchArea(
  lat: number, lng: number,
  branch: Branch
): boolean {
  if (branch.serviceType === 'polygon' && branch.polygonCoords.length >= 3) {
    return pointInPolygon(lat, lng, branch.polygonCoords);
  }
  // دایره
  const dist = haversineDistance(lat, lng, branch.centerLat, branch.centerLng);
  return dist <= branch.radiusMeters;
}

/**
 * پیدا کردن نزدیک‌ترین شعبه (بر اساس فاصله خط مستقیم)
 */
export function findNearestBranch(
  lat: number, lng: number,
  branches: Branch[]
): { branch: Branch; distance: number } | null {
  const active = branches.filter(b => b.isActive);
  if (active.length === 0) return null;
  
  let nearest = active[0];
  let minDist = haversineDistance(lat, lng, nearest.centerLat, nearest.centerLng);
  
  for (let i = 1; i < active.length; i++) {
    const dist = haversineDistance(lat, lng, active[i].centerLat, active[i].centerLng);
    if (dist < minDist) {
      minDist = dist;
      nearest = active[i];
    }
  }
  
  return { branch: nearest, distance: minDist };
}

/**
 * پیدا کردن همه شعب با فاصله
 */
export function findBranchesWithDistance(
  lat: number, lng: number,
  branches: Branch[]
): { branch: Branch; distance: number }[] {
  return branches
    .filter(b => b.isActive)
    .map(branch => ({
      branch,
      distance: haversineDistance(lat, lng, branch.centerLat, branch.centerLng),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * فرمت فاصله (متر یا کیلومتر)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} متر`;
  }
  return `${(meters / 1000).toFixed(1)} کیلومتر`;
}

/**
 * فرمت زمان تقریبی
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return 'کمتر از ۱ دقیقه';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} دقیقه`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours} ساعت`;
  }
  return `${hours} ساعت و ${mins} دقیقه`;
}

/**
 * تبدیل عدد به فارسی
 */
export function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}
