import React, { useState, useEffect, useMemo } from 'react';
import { Building, Room, MeterReading, formatCurrency, SERVICE_PRICES } from '../types';
import { Gauge, CheckCircle2, Save, Sparkles, AlertTriangle, Edit3, X } from 'lucide-react';

interface MetersProps {
  buildings: Building[];
  rooms: Room[];
  meters: MeterReading[];
  onSaveBatch: (payload: { month: number; year: number; readings: any[] }) => Promise<void>;
  onUpdateSingle: (id: string, payload: Partial<MeterReading>) => Promise<void>;
  onRefresh: () => void;
}

export default function Meters({ buildings, rooms, meters, onSaveBatch, onUpdateSingle, onRefresh }: MetersProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  
  // Grid state for inline entry
  // Key: roomId, Value: input form values
  const [gridValues, setGridValues] = useState<Record<string, {
    powerOld: number;
    powerNew: string;
    waterOld: number;
    waterNew: string;
    extraPrice: string;
    extraNotes: string;
  }>>({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [advancedEditMeter, setAdvancedEditMeter] = useState<MeterReading | null>(null);

  // Helper mapping for room display titles
  const roomMetaMap = useMemo(() => {
    const map: Record<string, { name: string; buildingName: string; basePrice: number }> = {};
    rooms.forEach(r => {
      const b = buildings.find(bld => bld.id === r.buildingId);
      map[r.id] = {
        name: r.name,
        buildingName: b ? b.name : 'Unknown',
        basePrice: r.basePrice
      };
    });
    return map;
  }, [rooms, buildings]);

  // Find occupied rooms since we only bill occupied rooms
  const activeRooms = useMemo(() => {
    return rooms.filter(r => r.status === 'occupied');
  }, [rooms]);

  // Compute and set inline grid values when Month, Year, Active Rooms or Meters change
  useEffect(() => {
    const newGrid: Record<string, any> = {};

    activeRooms.forEach(room => {
      // Find current reading if exists
      const current = meters.find(
        m => m.roomId === room.id && m.month === selectedMonth && m.year === selectedYear
      );

      // Find previous month's reading to pre-populate old index
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = selectedYear - 1;
      }

      const previous = meters.find(
        m => m.roomId === room.id && m.month === prevMonth && m.year === prevYear
      );

      // Old index fallback
      const powerOld = current ? current.powerOld : (previous ? previous.powerNew : 100);
      const waterOld = current ? current.waterOld : (previous ? previous.waterNew : 10);

      newGrid[room.id] = {
        powerOld,
        powerNew: current ? String(current.powerNew) : '',
        waterOld,
        waterNew: current ? String(current.waterNew) : '',
        extraPrice: current ? String(current.extraPrice) : '0',
        extraNotes: current ? current.extraNotes : ''
      };
    });

    setGridValues(newGrid);
  }, [selectedMonth, selectedYear, activeRooms, meters]);

  // Handle value change
  const handleInputChange = (roomId: string, field: string, value: string) => {
    setGridValues(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }));
  };

  // Submit all monthly readings
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const readings = Object.entries(gridValues).map(([roomId, valsRaw]) => {
        const vals = valsRaw as any;
        return {
          roomId,
          powerOld: vals.powerOld,
          powerNew: Number(vals.powerNew) || vals.powerOld, // fallback if empty
          waterOld: vals.waterOld,
          waterNew: Number(vals.waterNew) || vals.waterOld,
          extraPrice: Number(vals.extraPrice) || 0,
          extraNotes: vals.extraNotes || ''
        };
      });

      await onSaveBatch({
        month: selectedMonth,
        year: selectedYear,
        readings
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi lưu chỉ số tháng.');
    } finally {
      setSaving(false);
    }
  };

  // Save advanced dialog edit
  const handleSaveAdvanced = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancedEditMeter) return;

    try {
      await onUpdateSingle(advancedEditMeter.id, {
        powerOld: Number(advancedEditMeter.powerOld),
        powerNew: Number(advancedEditMeter.powerNew),
        waterOld: Number(advancedEditMeter.waterOld),
        waterNew: Number(advancedEditMeter.waterNew),
        extraPrice: Number(advancedEditMeter.extraPrice),
        extraNotes: advancedEditMeter.extraNotes
      });
      setAdvancedEditMeter(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu chỉnh sửa nâng cao.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="meters-title">Chốt Chỉ Số & Phụ Phí Tháng</h1>
          <p className="text-xs text-slate-500 mt-1">Ghi nhận nhanh số điện, nước tiêu dùng của toàn bộ các phòng trọ đang hoạt động.</p>
        </div>
        
        {/* Date Selector and Save Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <select
              id="meter-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select
              id="meter-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving || activeRooms.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-sm text-white transition-all cursor-pointer ${
              saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            id="btn-save-meters"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Đã Lưu Chỉ Số!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {saving ? 'Đang Lưu...' : 'Lưu Tất Cả Dữ Liệu Tháng'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid pricing reference alert */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Hệ thống tự động đồng bộ số cũ của tháng trước. Đơn giá: <strong>{formatCurrency(SERVICE_PRICES.powerUnitPrice)}/kWh điện</strong> và <strong>{formatCurrency(SERVICE_PRICES.waterUnitPrice)}/m³ nước</strong>.</span>
        </div>
        <div className="font-bold text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">Tháng Chốt: {selectedMonth}/{selectedYear}</div>
      </div>

      {/* Grid Table for inline data entries */}
      {activeRooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-active-rooms">
          <Gauge className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không Có Phòng Đang Thuê</h3>
          <p className="mt-1 text-xs text-slate-500">Toàn bộ các phòng đang ở trạng thái trống. Hãy thêm hợp đồng hoặc khách thuê trước.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="meters-grid-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="meters-grid-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider max-w-xs">Phòng & Tòa Nhà</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider bg-amber-50/10 text-center">Số Điện Cũ</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider bg-amber-50/30 text-center w-32">Số Điện Mới</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider bg-blue-50/10 text-center">Số Nước Cũ</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider bg-blue-50/30 text-center w-32">Số Nước Mới</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-center w-40">Phụ Phí Khác (đ)</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Ghi Chú Phụ Phí</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Nâng Cao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRooms.map(room => {
                  const values = gridValues[room.id] || {
                    powerOld: 0,
                    powerNew: '',
                    waterOld: 0,
                    waterNew: '',
                    extraPrice: '0',
                    extraNotes: ''
                  };

                  const meta = roomMetaMap[room.id] || { name: room.name, buildingName: 'Chung cư', basePrice: 0 };
                  
                  // Compute real-time numbers
                  const pNewNum = Number(values.powerNew);
                  const wNewNum = Number(values.waterNew);

                  const powerUsage = !values.powerNew ? 0 : Math.max(0, pNewNum - values.powerOld);
                  const waterUsage = !values.waterNew ? 0 : Math.max(0, wNewNum - values.waterOld);

                  const hasPowerError = !isNaN(pNewNum) && values.powerNew !== '' && pNewNum < values.powerOld;
                  const hasWaterError = !isNaN(wNewNum) && values.waterNew !== '' && wNewNum < values.waterOld;

                  // Find full meter object if exists to edit
                  const currentMeterObj = meters.find(
                    m => m.roomId === room.id && m.month === selectedMonth && m.year === selectedYear
                  );

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Name of Room & Building */}
                      <td className="p-4">
                        <span className="block font-bold text-slate-800 text-sm">{meta.name}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tòa: {meta.buildingName}</span>
                      </td>

                      {/* Electric: Old */}
                      <td className="p-4 text-center bg-amber-50/5 font-mono text-slate-500 font-semibold text-sm">
                        {values.powerOld}
                      </td>

                      {/* Electric: New Input */}
                      <td className="p-4 bg-amber-50/15">
                        <div className="space-y-1">
                          <input
                            type="number"
                            value={values.powerNew}
                            placeholder="Số mới"
                            onChange={(e) => handleInputChange(room.id, 'powerNew', e.target.value)}
                            className={`w-full rounded-lg border text-center font-mono text-xs px-2 py-1.5 shadow-xs focus:outline-none focus:ring-1 ${
                              hasPowerError 
                                ? 'bg-rose-50 border-rose-300 text-rose-950 focus:border-rose-500 focus:ring-rose-500 animate-pulse'
                                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                          />
                          {hasPowerError ? (
                            <span className="flex items-center gap-0.5 text-[9px] text-rose-600 font-bold justify-center uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Nhỏ hơn cũ
                            </span>
                          ) : (
                            values.powerNew && (
                              <span className="block text-[9px] text-emerald-600 text-center font-bold font-mono">
                                +{powerUsage} kWh ({formatCurrency(powerUsage * SERVICE_PRICES.powerUnitPrice)})
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Water: Old */}
                      <td className="p-4 text-center bg-blue-50/5 font-mono text-slate-500 font-semibold text-sm">
                        {values.waterOld}
                      </td>

                      {/* Water: New Input */}
                      <td className="p-4 bg-blue-50/15">
                        <div className="space-y-1">
                          <input
                            type="number"
                            value={values.waterNew}
                            placeholder="Số mới"
                            onChange={(e) => handleInputChange(room.id, 'waterNew', e.target.value)}
                            className={`w-full rounded-lg border text-center font-mono text-xs px-2 py-1.5 shadow-xs focus:outline-none focus:ring-1 ${
                              hasWaterError 
                                ? 'bg-rose-50 border-rose-300 text-rose-950 focus:border-rose-500 focus:ring-rose-500'
                                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                          />
                          {hasWaterError ? (
                            <span className="flex items-center gap-0.5 text-[9px] text-rose-600 font-bold justify-center uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Nhỏ hơn cũ
                            </span>
                          ) : (
                            values.waterNew && (
                              <span className="block text-[9px] text-indigo-600 text-center font-bold font-mono">
                                +{waterUsage} m³ ({formatCurrency(waterUsage * SERVICE_PRICES.waterUnitPrice)})
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Extra Price Input */}
                      <td className="p-4">
                        <input
                          type="number"
                          value={values.extraPrice}
                          placeholder="Phụ phí"
                          onChange={(e) => handleInputChange(room.id, 'extraPrice', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-center shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Extra Notes Input */}
                      <td className="p-4">
                        <input
                          type="text"
                          value={values.extraNotes}
                          placeholder="Sửa vòi nước, gửi xe phụ,..."
                          onChange={(e) => handleInputChange(room.id, 'extraNotes', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </td>

                      {/* Advanced Action */}
                      <td className="p-4 text-right">
                        {currentMeterObj ? (
                          <button
                            onClick={() => setAdvancedEditMeter(currentMeterObj)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Sửa
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Lưu để sửa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Bottom Save Panel */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-xs text-slate-500">Vui lòng rà soát kỹ các trường "Số mới" và nhấn "Lưu Tất Cả Dữ Liệu Tháng" để ghi nhận.</span>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              {saving ? 'Đang cập nhật chỉ số...' : 'Lưu Tất Cả Dữ Liệu Tháng'}
            </button>
          </div>
        </div>
      )}

      {/* Advanced Edit Dialog Modal */}
      {advancedEditMeter !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="advanced-meter-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Chỉnh Sửa Chỉ Số Nâng Cao</h3>
              <button 
                onClick={() => setAdvancedEditMeter(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdvanced} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 text-xs text-indigo-800 p-4 border border-indigo-100 rounded-xl leading-relaxed">
                Bạn đang sửa chi tiết chỉ số của <strong>{roomMetaMap[advancedEditMeter.roomId]?.name || advancedEditMeter.roomId}</strong> trong kỳ <strong>{advancedEditMeter.month}/{advancedEditMeter.year}</strong>.
              </div>

              {/* Electric inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện cũ</label>
                  <input
                    type="number"
                    value={advancedEditMeter.powerOld}
                    onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, powerOld: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện mới</label>
                  <input
                    type="number"
                    value={advancedEditMeter.powerNew}
                    onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, powerNew: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Water inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số nước cũ</label>
                  <input
                    type="number"
                    value={advancedEditMeter.waterOld}
                    onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, waterOld: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số nước mới</label>
                  <input
                    type="number"
                    value={advancedEditMeter.waterNew}
                    onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, waterNew: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Extra Price */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phụ phí phát sinh (VNĐ)</label>
                <input
                  type="number"
                  value={advancedEditMeter.extraPrice}
                  onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, extraPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Extra notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi chú phụ phí</label>
                <textarea
                  value={advancedEditMeter.extraNotes}
                  onChange={(e) => setAdvancedEditMeter({ ...advancedEditMeter, extraNotes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                  rows={2}
                  placeholder="Ghi rõ lý do phụ phí phát sinh..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdvancedEditMeter(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
