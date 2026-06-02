// سرویس مسیریابی با پشتیبانی نشان و OSRM
import { NESHAN_API_KEY } from '../config';

export interface RouteResult {
  coordinates: [number, number][];
  distance: number; // کیلومتر
  duration: number; // دقیقه
  success: boolean;
}

/**
 * مسیریابی با API نشان
 */
async function routeWithNeshan(
  startLat: number, startLng: number,
  endLat: number, endLng: number
): Promise<RouteResult | null> {
  try {
    const response = await fetch(
      `https://api.neshan.org/v4/direction?type=car&origin=${startLat},${startLng}&destination=${endLat},${endLng}`,
      {
        headers: {
          'Api-Key': NESHAN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.warn('Neshan routing failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      // تبدیل مختصات از فرمت نشان به [lat, lng]
      const coords: [number, number][] = [];
      
      if (route.overview_polyline && route.overview_polyline.points) {
        // دیکد کردن polyline
        const decoded = decodePolyline(route.overview_polyline.points);
        coords.push(...decoded);
      } else if (leg.steps) {
        // استفاده از steps
        for (const step of leg.steps) {
          if (step.start_location) {
            coords.push([step.start_location.lat, step.start_location.lng]);
          }
        }
        if (leg.steps.length > 0) {
          const lastStep = leg.steps[leg.steps.length - 1];
          if (lastStep.end_location) {
            coords.push([lastStep.end_location.lat, lastStep.end_location.lng]);
          }
        }
      }

      // اگر هیچ مختصاتی نبود، خط مستقیم
      if (coords.length < 2) {
        coords.push([startLat, startLng], [endLat, endLng]);
      }

      return {
        coordinates: coords,
        distance: leg.distance.value / 1000, // متر به کیلومتر
        duration: leg.duration.value / 60, // ثانیه به دقیقه
        success: true,
      };
    }

    return null;
  } catch (error) {
    console.error('Neshan routing error:', error);
    return null;
  }
}

/**
 * مسیریابی با OSRM (پشتیبان)
 */
async function routeWithOSRM(
  startLat: number, startLng: number,
  endLat: number, endLng: number
): Promise<RouteResult | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // تبدیل [lng, lat] به [lat, lng]
      );

      return {
        coordinates: coords,
        distance: route.distance / 1000,
        duration: route.duration / 60,
        success: true,
      };
    }

    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

/**
 * تابع اصلی مسیریابی - ابتدا نشان، سپس OSRM
 */
export async function calculateRoute(
  startLat: number, startLng: number,
  endLat: number, endLng: number
): Promise<RouteResult> {
  // ابتدا تلاش با نشان
  const neshanResult = await routeWithNeshan(startLat, startLng, endLat, endLng);
  if (neshanResult) {
    console.log('Route calculated with Neshan');
    return neshanResult;
  }

  // سپس تلاش با OSRM
  const osrmResult = await routeWithOSRM(startLat, startLng, endLat, endLng);
  if (osrmResult) {
    console.log('Route calculated with OSRM');
    return osrmResult;
  }

  // Fallback - خط مستقیم
  console.log('Using straight line fallback');
  const distance = haversineDistance(startLat, startLng, endLat, endLng);
  return {
    coordinates: [[startLat, startLng], [endLat, endLng]],
    distance: distance / 1000,
    duration: (distance / 1000) * 3, // تقریب ۳ دقیقه به ازای هر کیلومتر
    success: false,
  };
}

/**
 * دیکد کردن Google Polyline
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * محاسبه فاصله هاورساین
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
