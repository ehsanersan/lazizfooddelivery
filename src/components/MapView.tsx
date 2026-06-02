// کامپوننت نقشه با پشتیبانی نقشه نشان و مسیریابی
import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import type { Branch } from '../types';
import { NESHAN_API_KEY, BANDAR_ABBAS_CENTER, DEFAULT_ZOOM } from '../config';

// تایل‌های نقشه
const MAP_TILES = {
  neshan: {
    url: `https://api.neshan.org/v3/map-tiles/{z}/{x}/{y}.png?key=${NESHAN_API_KEY}`,
    attribution: '&copy; Neshan',
    name: '🇮🇷 نقشه نشان',
  },
  neshanSatellite: {
    url: `https://api.neshan.org/v3/map-tiles/{z}/{x}/{y}.png?key=${NESHAN_API_KEY}&style=satellite`,
    attribution: '&copy; Neshan',
    name: '🛰️ ماهواره‌ای نشان',
  },
  cartodbVoyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    name: '🗺️ نقشه رنگی',
  },
  cartodb: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
    name: '🗺️ نقشه ساده',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OSM',
    name: '🌍 OpenStreetMap',
  },
};

interface MapViewProps {
  branches: Branch[];
  userLocation?: [number, number] | null;
  pinnedLocation?: [number, number] | null;
  routeCoords?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  selectedBranch?: string | null;
  interactive?: boolean;
  height?: string;
  showZones?: boolean;
  allowPinning?: boolean;
  onPinLocation?: (lat: number, lng: number) => void;
}

export default function MapView({
  branches,
  userLocation,
  pinnedLocation,
  routeCoords,
  onMapClick,
  selectedBranch,
  interactive = true,
  height = '100%',
  showZones = true,
  allowPinning = false,
  onPinLocation,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pinnedMarkerRef = useRef<L.Marker | null>(null);
  const [currentTile, setCurrentTile] = useState<keyof typeof MAP_TILES>('neshan');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // ساخت نقشه
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BANDAR_ABBAS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

    const tile = MAP_TILES[currentTile];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 19,
    }).addTo(map);

    layersRef.current.addTo(map);
    routeLayerRef.current.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تغییر تایل نقشه
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tile = MAP_TILES[currentTile];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [currentTile]);

  // کلیک روی نقشه
  const onMapClickRef = useRef(onMapClick);
  const onPinLocationRef = useRef(onPinLocation);
  onMapClickRef.current = onMapClick;
  onPinLocationRef.current = onPinLocation;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (interactive && onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
      if (allowPinning && onPinLocationRef.current) {
        onPinLocationRef.current(e.latlng.lat, e.latlng.lng);
      }
    };
    
    map.off('click');
    map.on('click', handler);
  }, [interactive, allowPinning]);

  // رسم شعب و محدوده‌ها
  const drawBranches = useCallback(() => {
    const layers = layersRef.current;
    layers.clearLayers();

    branches.forEach((branch) => {
      if (!branch.isActive) return;

      const isSelected = selectedBranch === branch.id;

      // رسم محدوده
      if (showZones) {
        if (branch.serviceType === 'polygon' && branch.polygonCoords.length >= 3) {
          const polygon = L.polygon(branch.polygonCoords, {
            color: branch.color || '#7C3AED',
            fillColor: branch.color || '#7C3AED',
            fillOpacity: branch.fillOpacity || 0.2,
            weight: isSelected ? 3 : 2,
            dashArray: isSelected ? '0' : '6,4',
          });
          layers.addLayer(polygon);
        } else {
          const circle = L.circle([branch.centerLat, branch.centerLng], {
            radius: branch.radiusMeters || 2000,
            color: branch.color || '#7C3AED',
            fillColor: branch.color || '#7C3AED',
            fillOpacity: branch.fillOpacity || 0.15,
            weight: isSelected ? 3 : 2,
            dashArray: isSelected ? '0' : '6,4',
          });
          layers.addLayer(circle);
        }
      }

      // مارکر شعبه
      const icon = L.divIcon({
        className: 'branch-marker',
        html: `<div style="
          width: ${isSelected ? '52px' : '44px'};
          height: ${isSelected ? '52px' : '44px'};
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          ${isSelected ? 'transform: scale(1.1);' : ''}
        ">
          <span style="color: white; font-size: ${isSelected ? '22px' : '18px'};">🍽️</span>
        </div>`,
        iconSize: [isSelected ? 52 : 44, isSelected ? 52 : 44],
        iconAnchor: [isSelected ? 26 : 22, isSelected ? 26 : 22],
      });

      const marker = L.marker([branch.centerLat, branch.centerLng], { icon });
      marker.bindPopup(`
        <div style="text-align: right; direction: rtl; min-width: 220px; padding: 8px 4px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #7C3AED, #5B21B6); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">
              <span style="font-size: 22px;">🍽️</span>
            </div>
            <div>
              <h3 style="margin: 0; color: #1E1B4B; font-weight: 800; font-size: 15px;">${branch.name}</h3>
              <span style="font-size: 10px; color: #6B7280;">مجموعه غذایی لذیذ</span>
            </div>
          </div>
          <div style="background: #F9FAFB; border-radius: 12px; padding: 12px; font-size: 12px; color: #374151;">
            <p style="margin: 5px 0;">📍 ${branch.address}</p>
            <p style="margin: 5px 0;">📞 ${branch.phone}</p>
            <p style="margin: 5px 0;">🕐 ${branch.workingHours}</p>
          </div>
        </div>
      `, { className: 'custom-popup' });
      layers.addLayer(marker);
    });
  }, [branches, selectedBranch, showZones]);

  useEffect(() => {
    drawBranches();
  }, [drawBranches]);

  // مارکر موقعیت کاربر (GPS)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = L.divIcon({
        className: 'user-location-marker',
        html: `<div class="user-marker"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker(userLocation, { icon, zIndexOffset: 1000 })
        .bindPopup('<div style="direction:rtl;text-align:center;padding:6px;font-weight:bold;">📍 موقعیت GPS شما</div>')
        .addTo(map);

      map.setView(userLocation, 15);
    }
  }, [userLocation]);

  // مارکر پین شده توسط کاربر
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pinnedMarkerRef.current) {
      map.removeLayer(pinnedMarkerRef.current);
      pinnedMarkerRef.current = null;
    }

    if (pinnedLocation) {
      const icon = L.divIcon({
        className: 'pinned-marker',
        html: `<div style="
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 16px rgba(251, 191, 36, 0.5);
          display: flex; align-items: center; justify-content: center;
        ">
          <span style="font-size: 16px;">📌</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      pinnedMarkerRef.current = L.marker(pinnedLocation, { icon, zIndexOffset: 900, draggable: true })
        .bindPopup('<div style="direction:rtl;text-align:center;padding:6px;font-weight:bold;">📌 مکان انتخابی شما<br><small>برای جابجایی بکشید</small></div>')
        .addTo(map);
      
      // قابلیت درگ کردن مارکر
      pinnedMarkerRef.current.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        if (onPinLocationRef.current) {
          onPinLocationRef.current(position.lat, position.lng);
        }
      });
      
      map.setView(pinnedLocation, 15);
    }
  }, [pinnedLocation]);

  // رسم مسیر
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    routeLayer.clearLayers();

    if (routeCoords && routeCoords.length > 1) {
      // سایه مسیر
      const shadowLine = L.polyline(routeCoords, {
        color: '#1E1B4B',
        weight: 10,
        opacity: 0.15,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayer.addLayer(shadowLine);

      // مسیر اصلی
      const polyline = L.polyline(routeCoords, {
        color: '#7C3AED',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayer.addLayer(polyline);

      // خط‌چین
      const dashedLine = L.polyline(routeCoords, {
        color: '#FBBF24',
        weight: 3,
        opacity: 0.9,
        dashArray: '12,8',
        lineCap: 'round',
      });
      routeLayer.addLayer(dashedLine);

      if (mapRef.current) {
        mapRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });
      }
    }
  }, [routeCoords]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="rounded-2xl overflow-hidden"
        role="application"
        aria-label="نقشه لذیذ"
      />
      
      {/* انتخاب نوع نقشه */}
      <div className="absolute top-3 left-3 z-[1000]">
        <select
          value={currentTile}
          onChange={(e) => setCurrentTile(e.target.value as keyof typeof MAP_TILES)}
          className="glass text-xs px-3 py-2.5 rounded-xl border-0 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-laziz-purple font-medium"
          style={{ direction: 'rtl' }}
        >
          {Object.entries(MAP_TILES).map(([key, tile]) => (
            <option key={key} value={key}>{tile.name}</option>
          ))}
        </select>
      </div>

      {/* راهنمای پین کردن */}
      {allowPinning && (
        <div className="absolute top-3 right-3 z-[1000] glass rounded-xl px-4 py-2.5 text-xs text-gray-700 font-medium shadow-lg">
          📌 برای انتخاب مکان روی نقشه کلیک کنید
        </div>
      )}
    </div>
  );
}
