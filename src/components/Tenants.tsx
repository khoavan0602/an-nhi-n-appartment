import React, { useState, useMemo } from 'react';
import { Building, Room, Tenant } from '../types';
import { Users, Plus, Search, Trash2, Edit, X, Phone, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface TenantsProps {
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  onAdd: (tenant: Omit<Tenant, 'id'>) => Promise<void>;
  onUpdate: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Tenants({ buildings, rooms, tenants, onAdd, onUpdate, onDelete }: TenantsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [residenceFilter, setResidenceFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [roomId, setRoomId] = useState('');
  const [temporaryResidenceStatus, setTemporaryResidenceStatus] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setIdNumber('');
    setRoomId(rooms[0]?.id || '');
    setTemporaryResidenceStatus(false);
    setEditingTenant(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setName(t.name);
    setPhone(t.phone);
    setIdNumber(t.idNumber);
    setRoomId(t.roomId);
    setTemporaryResidenceStatus(t.temporaryResidenceStatus);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !roomId) {
      alert('Tên khách, số điện thoại và phòng trọ chọn là bắt buộc.');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      idNumber: idNumber.trim(),
      roomId,
      temporaryResidenceStatus
    };

    try {
      if (editingTenant) {
        await onUpdate(editingTenant.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu thông tin khách thuê.');
    }
  };

  const handleDeleteClick = (tenantId: string, tName: string) => {
    setDeletingId(tenantId);
    setDeletingName(tName);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa khách thuê.');
    }
  };

  // Lookup Maps
  const buildingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    buildings.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [buildings]);

  const roomsMap = useMemo(() => {
    const map: Record<string, { name: string; buildingName: string }> = {};
    rooms.forEach(r => {
      map[r.id] = {
        name: r.name,
        buildingName: buildingsMap[r.buildingId] || 'Không xác định'
      };
    });
    return map;
  }, [rooms, buildingsMap]);

  // Filter lists
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.phone.includes(searchTerm) || 
                          t.idNumber.includes(searchTerm);
      
      let matchResidence = true;
      if (residenceFilter === 'registered') {
        matchResidence = t.temporaryResidenceStatus === true;
      } else if (residenceFilter === 'unregistered') {
        matchResidence = t.temporaryResidenceStatus === false;
      }

      return matchSearch && matchResidence;
    });
  }, [tenants, searchTerm, residenceFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="tenants-title">Hồ Sơ Khách Thuê (Tenants)</h1>
          <p className="text-xs text-slate-500 mt-1">Quản lý cơ sở dữ liệu khách thuê trọ, số định danh cá nhân và trạng thái khai báo tạm trú.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={rooms.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-xs font-bold text-white rounded-lg shadow-sm transition-all w-fit cursor-pointer disabled:cursor-not-allowed"
          id="btn-add-tenant"
        >
          <Plus className="w-4 h-4" /> Đăng Ký Khách Thuê
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="tenant-toolbar">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại hoặc CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          />
        </div>

        {/* Residence Register Filter */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50 self-center">
          <button
            onClick={() => setResidenceFilter('all')}
            className={`flex-1 text-center py-1.5 px-3 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              residenceFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setResidenceFilter('registered')}
            className={`flex-1 text-center py-1.5 px-3 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              residenceFilter === 'registered' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đã khai báo
          </button>
          <button
            onClick={() => setResidenceFilter('unregistered')}
            className={`flex-1 text-center py-1.5 px-3 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              residenceFilter === 'unregistered' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chưa khai báo
          </button>
        </div>
      </div>

      {/* Tenants Table List */}
      {filteredTenants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-tenants">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không tìm thấy khách thuê nào</h3>
          <p className="mt-1 text-xs text-slate-500">Đăng ký khách thuê đầu tiên bằng cách nhấn nút "Đăng Ký Khách Thuê".</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="tenants-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="tenants-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Khách Thuê</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Số Điện Thoại</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">CCCD / Số Định Danh</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Đang Thuê Tại</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Khai Báo Tạm Trú</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map(t => {
                  const rInfo = roomsMap[t.roomId] || { name: t.roomId, buildingName: 'Không rõ' };
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="p-4 font-bold text-slate-800 text-sm">
                        {t.name}
                      </td>
                      <td className="p-4 text-slate-600 font-semibold font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold font-mono text-xs">
                        {t.idNumber || <span className="text-slate-300 font-medium italic">Chưa cập nhật</span>}
                      </td>
                      <td className="p-4">
                        <span className="block font-bold text-indigo-950 text-sm">{rInfo.name}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tòa: {rInfo.buildingName}</span>
                      </td>
                      <td className="p-4">
                        {t.temporaryResidenceStatus ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200/50 uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" /> Đã khai báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full border border-rose-200/50 uppercase tracking-wider">
                            <ShieldAlert className="w-3.5 h-3.5" /> Chưa khai báo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(t.id, t.name)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="tenant-form-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {editingTenant ? 'Cập Nhật Hồ Sơ Khách Thuê' : 'Đăng Ký Khách Thuê Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Họ Tên Khách Thuê</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxx"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số CCCD / Định Danh</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="12 số cccd"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bố Trí Nhận Phòng</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.name} - Tòa {buildingsMap[r.buildingId] || ''} ({r.status === 'empty' ? 'Còn Trống' : 'Có Người Ở'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox for Temporary Residence */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={temporaryResidenceStatus}
                      onChange={(e) => setTemporaryResidenceStatus(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Đăng Ký Tạm Trú Với Công An Địa Phương</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Tích chọn nếu khách thuê này đã hoàn tất thủ tục đăng ký lưu trú tạm thời theo đúng quy định.</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  {editingTenant ? 'Cập Nhật Hồ Sơ' : 'Đăng Ký Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => {
          setDeletingId(null);
          setDeletingName('');
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa khách thuê"
        message={`Bạn có chắc chắn muốn xóa khách thuê "${deletingName}" khỏi danh sách? Trạng thái phòng sẽ tự động cập nhật trống nếu không còn ai.`}
      />

    </div>
  );
}
