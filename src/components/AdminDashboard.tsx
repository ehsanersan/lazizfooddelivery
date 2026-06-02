// پنل مدیریت - داشبورد اصلی
import { useState, useEffect, useCallback } from 'react';
import type { Branch } from '../types';
import { getBranches, addBranch, updateBranch, deleteBranch, logout } from '../store';
import { toPersianNumber, isPointInBranchArea } from '../utils/geo';
import Logo from './Logo';
import MapView from './MapView';
import BranchForm from './BranchForm';
import Footer from './Footer';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<[number, number] | null>(null);
  const [showOverlaps, setShowOverlaps] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');

  useEffect(() => {
    setBranches(getBranches());
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPoint([lat, lng]);
    if (showForm && editingBranch) {
      setEditingBranch(prev => prev ? { ...prev, centerLat: lat, centerLng: lng } : null);
    }
  }, [showForm, editingBranch]);

  const handleAddBranch = () => {
    setEditingBranch(null);
    setShowForm(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setShowForm(true);
    setSelectedBranch(branch.id);
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('آیا از حذف این شعبه اطمینان دارید؟')) {
      const updated = deleteBranch(id);
      setBranches(updated);
      if (selectedBranch === id) setSelectedBranch(null);
    }
  };

  const handleSaveBranch = (branch: Branch) => {
    if (editingBranch) {
      const updated = updateBranch(branch);
      setBranches(updated);
    } else {
      const updated = addBranch(branch);
      setBranches(updated);
    }
    setShowForm(false);
    setEditingBranch(null);
    setClickedPoint(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBranch(null);
    setClickedPoint(null);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const activeBranches = branches.filter(b => b.isActive);

  // تشخیص تداخل محدوده‌ها
  const overlapInfo = (() => {
    const overlaps: { point: [number, number]; branches: string[] }[] = [];
    const seen = new Set<string>();
    
    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        // بررسی نقطه میانی
        const midLat = (activeBranches[i].centerLat + activeBranches[j].centerLat) / 2;
        const midLng = (activeBranches[i].centerLng + activeBranches[j].centerLng) / 2;
        
        const covering = activeBranches.filter((b: Branch) => isPointInBranchArea(midLat, midLng, b));
        if (covering.length > 1) {
          const key = covering.map((c: Branch) => c.id).sort().join('-');
          if (!seen.has(key)) {
            seen.add(key);
            overlaps.push({ 
              point: [midLat, midLng], 
              branches: covering.map((c: Branch) => c.name) 
            });
          }
        }
      }
    }
    return overlaps;
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* هدر */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-xs bg-gradient-to-r from-laziz-purple to-laziz-purple-dark text-white px-3 py-1 rounded-full font-bold">
              پنل مدیریت
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-laziz-purple/10 flex items-center justify-center">👤</div>
              مدیر سیستم
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 font-medium"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* تب‌ها */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { key: 'map' as const, label: '🗺️ نقشه' },
              { key: 'list' as const, label: '📋 لیست شعب' },
              { key: 'stats' as const, label: '📊 داشبورد' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3.5 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-laziz-purple text-laziz-purple'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
            <div className="lg:col-span-2 card overflow-hidden relative">
              <MapView
                branches={branches}
                onMapClick={handleMapClick}
                selectedBranch={selectedBranch}
                interactive={true}
                height="100%"
                showZones={true}
              />
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <button onClick={handleAddBranch} className="btn-primary text-sm flex items-center gap-2">
                  ➕ افزودن شعبه
                </button>
                <button
                  onClick={() => setShowOverlaps(!showOverlaps)}
                  className={`glass text-sm px-4 py-2.5 rounded-xl font-medium transition-all ${showOverlaps ? 'ring-2 ring-laziz-yellow' : ''}`}
                >
                  ⚠️ تداخل محدوده‌ها
                </button>
              </div>
              {clickedPoint && (
                <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl px-3 py-2 text-xs font-mono" dir="ltr">
                  📍 {clickedPoint[0].toFixed(5)}, {clickedPoint[1].toFixed(5)}
                </div>
              )}
            </div>

            <div className="overflow-y-auto">
              {showForm ? (
                <BranchForm
                  branch={editingBranch}
                  clickedPoint={clickedPoint}
                  onSave={handleSaveBranch}
                  onCancel={handleCancelForm}
                />
              ) : showOverlaps ? (
                <div className="card p-5 animate-scale-in">
                  <h3 className="font-bold text-lg text-laziz-dark mb-4 flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-laziz-yellow/20 flex items-center justify-center">⚠️</span>
                    تداخل محدوده‌ها
                  </h3>
                  {overlapInfo.length === 0 ? (
                    <div className="bg-green-50 text-green-700 text-sm p-4 rounded-xl">
                      ✅ هیچ تداخلی یافت نشد
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overlapInfo.map((ov, idx) => (
                        <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                          <p className="text-sm font-bold text-yellow-800">تداخل #{toPersianNumber(idx + 1)}</p>
                          <p className="text-xs text-yellow-600 mt-1">شعب: {ov.branches.join(' ، ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setShowOverlaps(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
                    ← بازگشت
                  </button>
                </div>
              ) : (
                <div className="card p-5 animate-fade-in">
                  <h3 className="font-bold text-lg text-laziz-dark mb-4 flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-laziz-purple/10 flex items-center justify-center">🏪</span>
                    شعب
                  </h3>
                  <div className="space-y-3">
                    {branches.map(branch => (
                      <div
                        key={branch.id}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          selectedBranch === branch.id
                            ? 'border-laziz-purple bg-laziz-purple/5 shadow-lg shadow-laziz-purple/10'
                            : 'border-gray-100 hover:border-gray-200'
                        } ${!branch.isActive ? 'opacity-50' : ''}`}
                        onClick={() => setSelectedBranch(selectedBranch === branch.id ? null : branch.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-laziz-purple to-laziz-purple-dark flex items-center justify-center text-white">
                            🍽️
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-laziz-dark">{branch.name}</h4>
                            <span className="text-[10px] text-gray-400">
                              {branch.serviceType === 'polygon' ? '🔷 چندضلعی' : '⭕ دایره'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{branch.address}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditBranch(branch); }}
                            className="flex-1 text-xs text-laziz-purple hover:text-white hover:bg-laziz-purple px-3 py-2 rounded-xl border border-laziz-purple/30 transition-all"
                          >
                            ✏️ ویرایش
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }}
                            className="text-xs text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-xl border border-red-200 transition-all"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="card overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-laziz-dark">📋 لیست شعب</h3>
              <button onClick={handleAddBranch} className="btn-primary text-sm">➕ افزودن شعبه</button>
            </div>
            {showForm ? (
              <div className="p-5">
                <BranchForm branch={editingBranch} clickedPoint={clickedPoint} onSave={handleSaveBranch} onCancel={handleCancelForm} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right p-4 font-bold text-gray-600">نام شعبه</th>
                      <th className="text-right p-4 font-bold text-gray-600 hidden md:table-cell">آدرس</th>
                      <th className="text-right p-4 font-bold text-gray-600 hidden sm:table-cell">تلفن</th>
                      <th className="text-right p-4 font-bold text-gray-600">نوع محدوده</th>
                      <th className="text-right p-4 font-bold text-gray-600">وضعیت</th>
                      <th className="text-right p-4 font-bold text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(branch => (
                      <tr key={branch.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-laziz-purple to-laziz-purple-dark flex items-center justify-center text-white">🍽️</div>
                            <span className="font-bold">{branch.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 hidden md:table-cell text-xs">{branch.address}</td>
                        <td className="p-4 text-gray-500 hidden sm:table-cell" dir="ltr">{branch.phone}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${branch.serviceType === 'polygon' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {branch.serviceType === 'polygon' ? '🔷 چندضلعی' : '⭕ دایره'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {branch.isActive ? '✓ فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditBranch(branch)} className="text-laziz-purple hover:bg-laziz-purple/10 p-2 rounded-lg">✏️</button>
                            <button onClick={() => handleDeleteBranch(branch.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="🏪" title="تعداد شعب" value={toPersianNumber(branches.length)} subtitle={`${toPersianNumber(activeBranches.length)} فعال`} gradient="from-laziz-purple to-laziz-purple-dark" />
              <StatCard icon="📍" title="محدوده نزدیک" value="۲ km" subtitle="مسیر تا شعبه" gradient="from-green-500 to-green-600" />
              <StatCard icon="⚠️" title="تداخل" value={toPersianNumber(overlapInfo.length)} subtitle="منطقه" gradient="from-yellow-500 to-orange-500" />
              <StatCard icon="📅" title="تأسیس" value="۱۳۸۴" subtitle="لذیذ پخت" gradient="from-laziz-yellow to-laziz-yellow-dark" />
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg text-laziz-dark mb-4">📍 راهنمای محدوده‌ها (بر اساس مسیریابی)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white">✅</div>
                    <div>
                      <h4 className="font-bold text-green-800">مسیر نزدیک</h4>
                      <p className="text-xs text-green-600">کمتر از ۲ کیلومتر مسیر</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-700">ارسال سریع - ۱۵ تا ۲۵ دقیقه</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white">⚠️</div>
                    <div>
                      <h4 className="font-bold text-yellow-800">مسیر دور</h4>
                      <p className="text-xs text-yellow-600">۲ تا ۴ کیلومتر مسیر</p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700">ارسال معمولی - ۲۵ تا ۴۰ دقیقه</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">🚗</div>
                    <div>
                      <h4 className="font-bold text-orange-800">خارج از محدوده</h4>
                      <p className="text-xs text-orange-600">بیش از ۴ کیلومتر مسیر</p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700">قابل ارسال از نزدیک‌ترین شعبه</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, gradient }: {
  icon: string; title: string; value: string; subtitle: string; gradient: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-black text-laziz-dark">{value}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
