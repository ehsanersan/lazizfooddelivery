// رابط کاربری مشتری - سیستم مکان‌یابی هوشمند با مسیریابی نشان
import { useState, useEffect, useCallback } from 'react';
import type { Branch, RouteInfo } from '../types';
import { getBranches } from '../store';
import { calculateRoute } from '../services/routing';
import {
  findNearestBranch,
  getZoneInfo,
  getZoneType,
  toPersianNumber,
  type ZoneType,
} from '../utils/geo';
import MapView from './MapView';
import Logo from './Logo';
import Footer from './Footer';

interface ClientViewProps {
  onAdminClick: () => void;
}

export default function ClientView({ onAdminClick }: ClientViewProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success' | 'denied' | 'error'
  >('idle');
  const [routeResult, setRouteResult] = useState<{
    branch: Branch;
    routeDistance: number;
    routeDuration: number;
    zone: ZoneType;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isPinMode, setIsPinMode] = useState(false);

  // بارگذاری شعب
  useEffect(() => {
    setBranches(getBranches());
  }, []);

  // دریافت موقعیت مکانی GPS
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    setPinnedLocation(null);
    setRouteResult(null);
    setRouteInfo(null);
    setIsPinMode(false);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setLocationStatus('success');
        // مسیریابی خودکار به نزدیک‌ترین شعبه
        await routeToNearestBranch(loc);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationStatus(err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // پین کردن مکان روی نقشه
  const handlePinLocation = useCallback(async (lat: number, lng: number) => {
    setPinnedLocation([lat, lng]);
    setUserLocation(null);
    setLocationStatus('idle');
    // مسیریابی خودکار
    await routeToNearestBranchFromPoint([lat, lng]);
  }, []);

  // فعال کردن حالت پین
  const enablePinMode = () => {
    setIsPinMode(true);
    setShowMobilePanel(false);
  };

  // مسیریابی به نزدیک‌ترین شعبه از یک نقطه
  const routeToNearestBranchFromPoint = async (startPoint: [number, number]) => {
    const activeBranches = branches.filter(b => b.isActive);
    const nearest = findNearestBranch(startPoint[0], startPoint[1], activeBranches);
    if (!nearest) return;

    await calculateRouteToTarget(startPoint, nearest.branch);
  };

  // مسیریابی به نزدیک‌ترین شعبه از موقعیت GPS
  const routeToNearestBranch = async (startPoint: [number, number]) => {
    await routeToNearestBranchFromPoint(startPoint);
  };

  // مسیریابی به شعبه خاص
  const calculateRouteToTarget = async (start: [number, number], targetBranch: Branch) => {
    setRouteLoading(true);
    setShowMobilePanel(true);
    
    try {
      const result = await calculateRoute(
        start[0], start[1],
        targetBranch.centerLat, targetBranch.centerLng
      );

      setRouteInfo({
        coordinates: result.coordinates,
        distance: result.distance,
        duration: result.duration,
      });

      setRouteResult({
        branch: targetBranch,
        routeDistance: result.distance,
        routeDuration: result.duration,
        zone: getZoneType(result.distance),
      });
    } catch (err) {
      console.error('Route calculation error:', err);
    }
    
    setRouteLoading(false);
  };

  // مسیریابی از مکان فعلی یا پین شده
  const getRouteFromCurrentLocation = async (targetBranch: Branch) => {
    const startPoint = userLocation || pinnedLocation || (searchResult && searchResult.lat !== 0 ? [searchResult.lat, searchResult.lng] as [number, number] : null);
    if (!startPoint) {
      alert('لطفاً ابتدا موقعیت خود را مشخص کنید (GPS یا پین روی نقشه)');
      return;
    }
    await calculateRouteToTarget(startPoint, targetBranch);
  };

  // جستجوی محله
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    setRouteInfo(null);
    setRouteResult(null);
    
    try {
      const query = encodeURIComponent(`${searchQuery.trim()} بندرعباس`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=ir`,
        { headers: { 'Accept-Language': 'fa' } }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const r = data[0];
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setSearchResult({ lat, lng, name: r.display_name });
        setPinnedLocation([lat, lng]);
        setUserLocation(null);
        // مسیریابی خودکار
        await routeToNearestBranchFromPoint([lat, lng]);
      } else {
        setSearchResult({ lat: 0, lng: 0, name: 'نتیجه‌ای یافت نشد' });
      }
    } catch {
      setSearchResult({ lat: 0, lng: 0, name: 'خطا در جستجو' });
    }
    setSearchLoading(false);
  };

  const clearRoute = () => {
    setRouteInfo(null);
    setRouteResult(null);
  };

  const activeBranches = branches.filter((b) => b.isActive);

  // --- صفحه هیرو ---
  if (showHero) {
    return (
      <div className="min-h-screen flex flex-col bg-laziz-dark overflow-hidden">
        <header className="glass-dark sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Logo size="sm" light />
            <button
              onClick={onAdminClick}
              className="text-xs text-white/50 hover:text-white/80 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              🔒 ورود مدیریت
            </button>
          </div>
        </header>

        <div className="relative flex-1 flex items-center justify-center">
          {/* پس‌زمینه */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-laziz-dark via-laziz-purple-dark/30 to-laziz-dark" />
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-laziz-purple/20 rounded-full blur-3xl animate-pulse-soft" />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-laziz-yellow/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-laziz-purple/10 rounded-full blur-3xl" />
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative z-10 text-center px-6 max-w-3xl animate-fade-in">
            <div className="flex justify-center mb-8">
              <div className="animate-float">
                <Logo size="lg" light />
              </div>
            </div>

            <h2 className="text-white/90 text-lg md:text-xl font-light leading-relaxed mb-4">
              سیستم هوشمند
              <span className="text-laziz-yellow font-bold mx-2">مکان‌یابی سفارشات غیرحضوری</span>
            </h2>

            <p className="text-white/60 text-sm md:text-base leading-relaxed mb-10 max-w-xl mx-auto">
              بررسی هوشمند محدوده سفارشات غیرحضوری و مسیریابی هوشمند لذیذ پخت خلیج فارس
            </p>

            {/* دکمه‌ها */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setShowHero(false)}
                className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-3"
              >
                <span className="text-xl">🗺️</span>
                مشاهده نقشه شعب
              </button>
              <button
                onClick={() => {
                  setShowHero(false);
                  setTimeout(requestLocation, 500);
                }}
                className="btn-secondary text-base px-8 py-4 flex items-center justify-center gap-3"
              >
                <span className="text-xl">📍</span>
                تعیین موقعیت من
              </button>
            </div>

            {/* کارت‌های اطلاعاتی */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="glass-dark rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-3xl font-black text-laziz-yellow mb-1">
                  {toPersianNumber(activeBranches.length)}
                </div>
                <div className="text-xs text-white/50">شعبه فعال</div>
              </div>
              <div className="glass-dark rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-2xl font-black text-laziz-yellow mb-1">
                  {toPersianNumber(1384)}
                </div>
                <div className="text-xs text-white/50">سال تأسیس</div>
              </div>
              <div className="glass-dark rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-2xl mb-1">🚀</div>
                <div className="text-xs text-white/50">ارسال سریع</div>
              </div>
            </div>

            {/* راهنمای محدوده‌ها */}
            <div className="mt-12 glass-dark rounded-2xl p-5 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-white/80 text-sm font-bold mb-4">📍 محدوده‌های ارسال (بر اساس مسیریابی)</h3>
              <div className="space-y-2 text-xs text-right">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
                  <span className="text-white/70">مسیر نزدیک: تا ۲ کیلومتر - ارسال سریع</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30" />
                  <span className="text-white/70">مسیر دور: ۲ تا ۴ کیلومتر - ارسال معمولی</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30" />
                  <span className="text-white/70">خارج از محدوده: بیش از ۴ کیلومتر - ارسال از نزدیک‌ترین شعبه</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // --- صفحه نقشه ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHero(true)}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              aria-label="بازگشت"
            >
              →
            </button>
            <Logo size="sm" />
          </div>
          <button
            onClick={onAdminClick}
            className="text-xs text-gray-400 hover:text-laziz-purple px-3 py-2 rounded-xl hover:bg-laziz-purple/5 transition-all"
          >
            🔒 مدیریت
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {/* نقشه */}
        <div className="absolute inset-0">
          <MapView
            branches={branches}
            userLocation={userLocation}
            pinnedLocation={pinnedLocation}
            routeCoords={routeInfo?.coordinates}
            interactive={false}
            height="100%"
            showZones={true}
            allowPinning={isPinMode}
            onPinLocation={handlePinLocation}
          />
        </div>

        {/* نوار وضعیت مسیریابی */}
        {routeLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] glass-dark rounded-full px-6 py-3 flex items-center gap-3 animate-fade-in">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">در حال محاسبه مسیر...</span>
          </div>
        )}

        {/* دکمه موبایل */}
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] md:hidden bg-gradient-to-r from-laziz-purple to-laziz-purple-dark text-white px-6 py-3 rounded-2xl shadow-lg shadow-laziz-purple/30 text-sm font-bold active:scale-95 transition-transform flex items-center gap-2"
        >
          {showMobilePanel ? '🗺️ نمایش نقشه' : '📋 پنل اطلاعات'}
        </button>

        {/* پنل کناری */}
        <div
          className={`absolute z-[1000] transition-all duration-500 ease-out
          ${
            showMobilePanel
              ? 'bottom-0 left-0 right-0 md:bottom-auto md:top-4 md:right-4 md:left-auto md:w-[400px]'
              : 'bottom-[-100%] md:bottom-auto md:top-4 md:right-4 md:left-auto md:w-[400px]'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[60vh] md:max-h-[calc(100vh-100px)] overflow-y-auto border border-gray-100">
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="p-5 space-y-5">
              {/* جستجو */}
              <div>
                <label className="block text-sm font-bold text-laziz-dark mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-laziz-purple/10 flex items-center justify-center">🔍</span>
                  جستجوی منطقه
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="input-modern flex-1"
                    placeholder="نام محله یا منطقه..."
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="btn-primary w-14 flex items-center justify-center disabled:opacity-50"
                  >
                    {searchLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      '🔍'
                    )}
                  </button>
                </div>
                {searchResult && searchResult.lat === 0 && (
                  <p className="text-xs text-red-500 mt-2">{searchResult.name}</p>
                )}
              </div>

              {/* دکمه‌های موقعیت */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={requestLocation}
                  disabled={locationStatus === 'loading'}
                  className="bg-gradient-to-r from-laziz-dark to-laziz-purple-dark text-white py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {locationStatus === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>📍 موقعیت GPS</>
                  )}
                </button>
                <button
                  onClick={enablePinMode}
                  className={`py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                    isPinMode 
                      ? 'bg-laziz-yellow text-laziz-dark ring-2 ring-laziz-yellow ring-offset-2' 
                      : 'bg-gradient-to-r from-laziz-yellow to-laziz-yellow-dark text-laziz-dark'
                  }`}
                >
                  📌 {isPinMode ? 'در حال پین...' : 'پین روی نقشه'}
                </button>
              </div>

              {/* پیام‌های خطا */}
              {locationStatus === 'denied' && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-2xl animate-scale-in">
                  <strong>⚠️ دسترسی رد شد</strong>
                  <p className="mt-1 text-red-500">لطفاً از تنظیمات مرورگر مجوز موقعیت را فعال کنید.</p>
                </div>
              )}
              {locationStatus === 'error' && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-2xl animate-scale-in">
                  <strong>❌ خطا</strong>
                  <p className="mt-1 text-red-500">مشکلی در دریافت موقعیت رخ داد.</p>
                </div>
              )}

              {/* نتیجه مسیریابی */}
              {routeResult && (
                <RouteResultCard
                  result={routeResult}
                  onClear={clearRoute}
                />
              )}

              {/* لیست شعب */}
              <div>
                <h4 className="font-bold text-sm text-laziz-dark mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-laziz-yellow/20 flex items-center justify-center">🏪</span>
                  شعبه‌های لذیذ
                  <span className="text-xs text-gray-400 font-normal mr-1">(برای مسیریابی کلیک کنید)</span>
                </h4>
                <div className="space-y-3">
                  {activeBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="card p-4 cursor-pointer group hover:border-laziz-purple/30"
                      onClick={() => getRouteFromCurrentLocation(branch)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-laziz-purple to-laziz-purple-dark flex items-center justify-center text-white shadow-lg shadow-laziz-purple/20">
                          🍽️
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-sm text-laziz-dark">{branch.name}</h5>
                          <p className="text-xs text-gray-400">📍 {branch.address}</p>
                        </div>
                        <div className="text-laziz-purple opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                          ←
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                        <span>📞 {branch.phone}</span>
                        <span>🕐 {branch.workingHours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* --- کامپوننت نتیجه مسیریابی --- */
function RouteResultCard({
  result,
  onClear,
}: {
  result: { branch: Branch; routeDistance: number; routeDuration: number; zone: ZoneType };
  onClear: () => void;
}) {
  const zoneInfo = getZoneInfo(result.zone);

  return (
    <div
      className={`rounded-2xl p-4 animate-scale-in border ${
        result.zone === 'near'
          ? 'bg-green-50 border-green-200'
          : result.zone === 'far'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-orange-50 border-orange-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${zoneInfo.bgColor} shadow-lg`}>
            {zoneInfo.icon}
          </div>
          <div>
            <h4 className={`font-bold text-sm ${
              result.zone === 'near' ? 'text-green-800' : result.zone === 'far' ? 'text-yellow-800' : 'text-orange-800'
            }`}>
              {zoneInfo.label}
            </h4>
            <p className="text-xs text-gray-500">{zoneInfo.description}</p>
          </div>
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
      </div>

      {/* اطلاعات مسیر */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-black text-laziz-purple">{toPersianNumber(result.routeDistance.toFixed(1))}</p>
          <p className="text-[10px] text-gray-500">کیلومتر مسیر</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-black text-laziz-purple">{toPersianNumber(Math.round(result.routeDuration))}</p>
          <p className="text-[10px] text-gray-500">دقیقه تقریبی</p>
        </div>
      </div>

      {/* شعبه سرویس‌دهنده */}
      <div className="bg-white/80 rounded-xl p-3 mb-3">
        <p className="text-xs text-gray-500 mb-1">شعبه سرویس‌دهنده:</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-laziz-purple to-laziz-purple-dark flex items-center justify-center text-white text-sm shadow">
            🍽️
          </div>
          <div>
            <p className="font-bold text-sm">{result.branch.name}</p>
            <p className="text-xs text-gray-400">{result.branch.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>📞 {result.branch.phone}</span>
          <span>🕐 {result.branch.workingHours}</span>
        </div>
      </div>

      {/* یادداشت ارسال */}
      <div className={`text-xs p-3 rounded-xl font-medium ${
        result.zone === 'near' ? 'bg-green-100 text-green-700' : 
        result.zone === 'far' ? 'bg-yellow-100 text-yellow-700' : 
        'bg-orange-100 text-orange-700'
      }`}>
        🚀 {zoneInfo.deliveryNote}
      </div>
    </div>
  );
}
