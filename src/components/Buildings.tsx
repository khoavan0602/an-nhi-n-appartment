import React, { useState, useMemo } from 'react';
import { Building, Room } from '../types';
import { Building2, Plus, Search, Trash2, Edit, X, MapPin, AlignLeft } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface BuildingsProps {
  buildings: Building[];
  rooms: Room[];
  onAdd: (building: Omit<Building, 'id'>) => Promise<void>;
  onUpdate: (id: string, building: Partial<Building>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Buildings({ buildings, rooms, onAdd, onUpdate, onDelete }: BuildingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setAddress('');
    setDescription('');
    setEditingBuilding(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Building) => {
    setEditingBuilding(b);
    setName(b.name);
    setAddress(b.address);
    setDescription(b.description);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert('Tên tòa nhà và địa chỉ là bắt buộc.');
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim(),
      description: description.trim()
    };

    try {
      if (editingBuilding) {
        await onUpdate(editingBuilding.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu tòa nhà.');
    }
  };

  const handleDeleteClick = (buildingId: string, bName: string) => {
    const buildingRooms = rooms.filter(r => r.buildingId === buildingId);
    if (buildingRooms.length > 0) {
      alert(`Không thể xóa tòa nhà "${bName}" vì đang chứa ${buildingRooms.length} phòng trọ hoạt động. Hãy xóa hoặc điều chuyển phòng trước.`);
      return;
    }

    setDeletingId(buildingId);
    setDeletingName(bName);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa tòa nhà.');
    }
  };

  const filteredBuildings = useMemo(() => {
    return buildings.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [buildings, searchTerm]);

  // Compute room count for each building
  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms.forEach(r => {
      counts[r.buildingId] = (counts[r.buildingId] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="buildings-title">Quản Lý Tòa Nhà (Blocks)</h1>
          <p className="text-xs text-slate-500 mt-1">Khai báo, chỉnh sửa thông tin các block chung cư mini, nhà trọ dòng tiền trong chuỗi.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg shadow-sm transition-all w-fit cursor-pointer"
          id="btn-add-building"
        >
          <Plus className="w-4 h-4" /> Thêm Tòa Nhà Mới
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md" id="building-search-bar">
        <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm tên tòa nhà hoặc địa chỉ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
        />
      </div>

      {/* Grid of building cards */}
      {filteredBuildings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-buildings">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Chưa khai báo tòa nhà</h3>
          <p className="mt-1 text-xs text-slate-500">Hãy thêm tòa nhà/chung cư mini đầu tiên để quản lý các phòng trọ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="buildings-grid">
          {filteredBuildings.map(b => {
            const count = roomCounts[b.id] || 0;
            return (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-indigo-50/75 p-2 text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {count} Phòng
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                    <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </p>
                    {b.description && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1 flex items-start gap-1.5 font-medium">
                        <AlignLeft className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                        <span>{b.description}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit className="w-3 h-3" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(b.id, b.name)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="building-form-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {editingBuilding ? 'Cập Nhật Thông Tin Tòa Nhà' : 'Thêm Tòa Nhà Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Tòa Nhà / Block</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Tòa Nhà Happy House"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Địa Chỉ Chi Tiết</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, ngõ ngách, quận huyện,..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mô Tả / Ghi Chú Tiện Ích</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả số tầng, trang bị thang máy, bảo vệ hoặc giờ giấc tự do..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none"
                  rows={3}
                />
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
                  {editingBuilding ? 'Lưu thay đổi' : 'Thêm Tòa Nhà'}
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
        title="Xác nhận xóa tòa nhà"
        message={`Bạn có chắc chắn muốn xóa tòa nhà "${deletingName}"? Thao tác này không thể hoàn tác.`}
      />

    </div>
  );
}
