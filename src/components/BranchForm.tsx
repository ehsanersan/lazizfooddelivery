// فرم افزودن/ویرایش شعبه با پشتیبانی چندضلعی
import { useState, useEffect } from 'react';
import type { Branch } from '../types';

interface BranchFormProps {
  branch: Branch | null;
  clickedPoint: [number, number] | null;
  onSave: (branch: Branch) => void;
  onCancel: () => void;
}

const generateId = () => `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function BranchForm({ branch, clickedPoint, onSave, onCancel }: BranchFormProps) {
  const [form, setForm] = useState<Branch>({
    id: branch?.id || generateId(),
    name: branch?.name || '',
    address: branch?.address || '',
    phone: branch?.phone || '076-3204',
    centerLat: branch?.centerLat || 27.1865,
    centerLng: branch?.centerLng || 56.2684,
    serviceType: branch?.serviceType || 'circle',
    radiusMeters: branch?.radiusMeters || 2000,
    polygonCoords: branch?.polygonCoords || [],
    color: branch?.color || '#7C3AED',
    fillOpacity: branch?.fillOpacity || 0.2,
    workingHours: branch?.workingHours || '11:00 - 23:00',
    isActive: branch?.isActive ?? true,
  });

  const [polygonInput, setPolygonInput] = useState(
    branch?.polygonCoords?.map(c => `${c[0]},${c[1]}`).join('\n') || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // بروزرسانی مختصات از کلیک روی نقشه
  useEffect(() => {
    if (clickedPoint) {
      if (form.serviceType === 'polygon') {
        // اضافه کردن به لیست چندضلعی
        const newCoord = `${clickedPoint[0]},${clickedPoint[1]}`;
        setPolygonInput(prev => prev ? `${prev}\n${newCoord}` : newCoord);
      } else {
        // مرکز دایره
        setForm(prev => ({
          ...prev,
          centerLat: clickedPoint[0],
          centerLng: clickedPoint[1],
        }));
      }
    }
  }, [clickedPoint, form.serviceType]);

  const parsePolygonCoords = (): [number, number][] => {
    return polygonInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(',').map(s => parseFloat(s.trim()));
        return [parts[0], parts[1]] as [number, number];
      })
      .filter(c => !isNaN(c[0]) && !isNaN(c[1]));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'نام شعبه الزامی است';
    if (!form.address.trim()) newErrors.address = 'آدرس الزامی است';
    if (!form.phone.trim()) newErrors.phone = 'شماره تماس الزامی است';
    if (form.serviceType === 'polygon' && parsePolygonCoords().length < 3) {
      newErrors.polygon = 'حداقل ۳ نقطه برای چندضلعی لازم است';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const coords = parsePolygonCoords();
    const branchToSave: Branch = {
      ...form,
      polygonCoords: form.serviceType === 'polygon' ? coords : [],
      // برای چندضلعی، مرکز را از میانگین نقاط محاسبه کن
      centerLat: form.serviceType === 'polygon' && coords.length >= 3
        ? coords.reduce((sum, c) => sum + c[0], 0) / coords.length
        : form.centerLat,
      centerLng: form.serviceType === 'polygon' && coords.length >= 3
        ? coords.reduce((sum, c) => sum + c[1], 0) / coords.length
        : form.centerLng,
    };
    onSave(branchToSave);
  };

  const updateField = <K extends keyof Branch>(key: K, value: Branch[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const clearPolygon = () => {
    setPolygonInput('');
  };

  return (
    <div className="card p-5 animate-scale-in">
      <h3 className="font-bold text-lg text-laziz-dark mb-5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-laziz-purple/10 flex items-center justify-center">
          {branch ? '✏️' : '➕'}
        </span>
        {branch ? 'ویرایش شعبه' : 'افزودن شعبه جدید'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* نام شعبه */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            نام شعبه <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
            className="input-modern"
            placeholder="مثال: شعبه رسالت"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
        </div>

        {/* آدرس */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            آدرس <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.address}
            onChange={e => updateField('address', e.target.value)}
            className="input-modern resize-none"
            rows={2}
            placeholder="آدرس کامل شعبه"
          />
          {errors.address && <p className="text-xs text-red-500 mt-1.5">{errors.address}</p>}
        </div>

        {/* تلفن و ساعت کاری */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">شماره تماس</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              className="input-modern"
              placeholder="076-3204"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ساعت کاری</label>
            <input
              type="text"
              value={form.workingHours}
              onChange={e => updateField('workingHours', e.target.value)}
              className="input-modern"
              placeholder="11:00 - 23:00"
              dir="ltr"
            />
          </div>
        </div>

        {/* نوع محدوده */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">نوع محدوده</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateField('serviceType', 'circle')}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                form.serviceType === 'circle'
                  ? 'border-laziz-purple bg-laziz-purple/10 text-laziz-purple'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              ⭕ دایره‌ای
            </button>
            <button
              type="button"
              onClick={() => updateField('serviceType', 'polygon')}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                form.serviceType === 'polygon'
                  ? 'border-laziz-purple bg-laziz-purple/10 text-laziz-purple'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              🔷 چندضلعی
            </button>
          </div>
        </div>

        {/* تنظیمات دایره */}
        {form.serviceType === 'circle' && (
          <>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                مختصات مرکز
                <span className="text-gray-400 text-xs font-normal mr-2">(روی نقشه کلیک کنید)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.00001"
                  value={form.centerLat}
                  onChange={e => updateField('centerLat', parseFloat(e.target.value) || 0)}
                  className="input-modern text-sm font-mono"
                  placeholder="عرض جغرافیایی"
                  dir="ltr"
                />
                <input
                  type="number"
                  step="0.00001"
                  value={form.centerLng}
                  onChange={e => updateField('centerLng', parseFloat(e.target.value) || 0)}
                  className="input-modern text-sm font-mono"
                  placeholder="طول جغرافیایی"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                شعاع محدوده: {(form.radiusMeters / 1000).toFixed(1)} کیلومتر
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={form.radiusMeters}
                onChange={e => updateField('radiusMeters', parseInt(e.target.value))}
                className="w-full accent-laziz-purple"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>۵۰۰ متر</span>
                <span>۵ کیلومتر</span>
              </div>
            </div>
          </>
        )}

        {/* تنظیمات چندضلعی */}
        {form.serviceType === 'polygon' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">
                نقاط چندضلعی
                <span className="text-gray-400 text-xs font-normal mr-2">
                  (روی نقشه کلیک کنید یا دستی وارد کنید)
                </span>
              </label>
              <button
                type="button"
                onClick={clearPolygon}
                className="text-xs text-red-500 hover:text-red-700"
              >
                🗑️ پاک کردن
              </button>
            </div>
            <textarea
              value={polygonInput}
              onChange={e => setPolygonInput(e.target.value)}
              className="input-modern font-mono text-xs"
              rows={6}
              dir="ltr"
              placeholder={`27.1900,56.2800\n27.1920,56.2850\n27.1880,56.2870\n...\n(هر خط: lat,lng)`}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                تعداد نقاط: <strong>{parsePolygonCoords().length}</strong>
              </p>
              {parsePolygonCoords().length >= 3 && (
                <span className="text-xs text-green-600">✓ کافی</span>
              )}
            </div>
            {errors.polygon && <p className="text-xs text-red-500 mt-1">{errors.polygon}</p>}
          </div>
        )}

        {/* رنگ و شفافیت */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رنگ محدوده</label>
            <div className="color-picker-wrapper flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={e => updateField('color', e.target.value)}
              />
              <span className="text-xs text-gray-500 font-mono" dir="ltr">{form.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              شفافیت: {Math.round(form.fillOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={form.fillOpacity}
              onChange={e => updateField('fillOpacity', parseFloat(e.target.value))}
              className="w-full accent-laziz-purple"
            />
          </div>
        </div>

        {/* وضعیت */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={e => updateField('isActive', e.target.checked)}
            className="w-5 h-5 accent-laziz-purple rounded"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
            شعبه فعال است
          </label>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1">
            {branch ? '💾 ذخیره تغییرات' : '➕ افزودن شعبه'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}
