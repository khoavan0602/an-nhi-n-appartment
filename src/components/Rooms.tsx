import React, { useState, useMemo } from 'react';
import { Building, Room, formatCurrency } from '../types';
import { Home, Plus, Search, Trash2, Edit, X, DollarSign, Filter } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface RoomsProps {
  buildings: Building[];
  rooms: Room[];
  onAdd: (room: Omit<Room, 'id'>) => Promise<void>;
  onUpdate: (id: string, room: Partial<Room>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Rooms({ buildings, rooms, onAdd, onUpdate, onDelete }: RoomsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('name_asc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const [buildingId, setBuildingId] = useState('');
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [status, setStatus] = useState<'empty' | 'occupied'>('empty');

  const resetForm = () => {
    setBuildingId(buildings[0]?.id || '');
    setName('');
    setBasePrice('');
    setStatus('empty');
    setEditingRoom(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (r: Room) => {
    setEditingRoom(r);
    setBuildingId(r.buildingId);
    setName(r.name);
    setBasePrice(String(r.basePrice));
    setStatus(r.status);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !name.trim() || !basePrice) {
      alert('Tòa nhà, tên phòng và giá thuê là bắt buộc.');
      return;
    }

    const payload = {
      buildingId,
      name: name.trim(),
      basePrice: Number(basePrice),
      status
    };

    try {
      if (editingRoom) {
        await onUpdate(editingRoom.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu phòng trọ.');
    }
  };

  const handleDeleteClick = (roomId: string, rName: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.status === 'occupied') {
      alert(`Không thể xóa "${rName}" vì phòng đang có khách thuê ở thực tế. Vui lòng kết thúc hợp đồng hoặc chuyển khách thuê đi trước.`);
      return;
    }

    setDeletingId(roomId);
    setDeletingName(rName);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa phòng trọ.');
    }
  };

  // Lookup maps
  const buildingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    buildings.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [buildings]);

  // Filter lists
  const filteredRooms = useMemo(() => {
    let result = rooms.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBuilding = selectedBuilding === 'all' || r.buildingId === selectedBuilding;
      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
      return matchesSearch && matchesBuilding && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'name_asc') {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortOrder === 'name_desc') {
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortOrder === 'price_desc') {
        return b.basePrice - a.basePrice;
      } else if (sortOrder === 'price_asc') {
        return a.basePrice - b.basePrice;
      }
      return 0;
    });

    return result;
  }, [rooms, searchTerm, selectedBuilding, selectedStatus, sortOrder]);

  // Compute room analytics based on filtered subset
  const roomStats = useMemo(() => {
    let totalCount = filteredRooms.length;
    let emptyCount = 0;
    let occupiedCount = 0;
    let totalValue = 0;

    filteredRooms.forEach(r => {
      if (r.status === 'occupied') {
        occupiedCount++;
      } else {
        emptyCount++;
      }
      totalValue += r.basePrice;
    });

    return {
      totalCount,
      emptyCount,
      occupiedCount,
      totalValue
    };
  }, [filteredRooms]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="rooms-title">Quản Lý Phòng Trọ</h1>
          <p className="text-xs text-slate-500 mt-1">Giám sát danh sách phòng trọ, căn hộ, giá thuê niêm yết và trạng thái trống/đang ở.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={buildings.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-xs font-bold text-white rounded-lg shadow-sm transition-all w-fit cursor-pointer disabled:cursor-not-allowed"
          id="btn-add-room"
        >
          <Plus className="w-4 h-4" /> Thêm Phòng Trọ Mới
        </button>
      </div>

      {/* Premium mini-overview panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs" id="rooms-summary-panel">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số phòng</span>
            <span className="block text-base font-bold font-mono text-slate-800 mt-0.5">{roomStats.totalCount} phòng</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng đang ở (Occupied)</span>
            <span className="block text-base font-bold font-mono text-emerald-600 mt-0.5">{roomStats.occupiedCount} phòng</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-lg shrink-0">
            <Home className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phòng trống (Empty)</span>
            <span className="block text-base font-bold font-mono text-slate-500 mt-0.5">{roomStats.emptyCount} phòng trống</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu niêm yết</span>
            <span className="block text-base font-bold font-mono text-amber-600 mt-0.5">{formatCurrency(roomStats.totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="room-filters">
        {/* Search */}
        <div className="col-span-2 lg:col-span-1 relative">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng (101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 h-9"
          />
        </div>

        {/* Building Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả tòa nhà</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="empty">Phòng trống (Empty)</option>
            <option value="occupied">Đang ở (Occupied)</option>
          </select>
        </div>

        {/* Sorting selection dropdown */}
        <div className="flex items-center gap-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 hidden xl:inline">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-indigo-100 bg-white px-2 py-2 text-xs font-semibold text-indigo-600 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="name_asc">Tên phòng: A → Z</option>
            <option value="name_desc">Tên phòng: Z → A</option>
            <option value="price_desc">Giá niêm yết: Cao nhất</option>
            <option value="price_asc">Giá niêm yết: Thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Rooms Table / Grid */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-rooms">
          <Home className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không tìm thấy phòng trọ nào</h3>
          <p className="mt-1 text-xs text-slate-500">Hãy khai báo phòng đầu tiên hoặc điều chỉnh bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="rooms-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="rooms-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phòng Trọ</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Thuộc Tòa Nhà</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Giá Thuê Cơ Bản / Tháng</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-md bg-indigo-50/75 p-1.5 text-indigo-600">
                          <Home className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">
                      {buildingsMap[r.buildingId] || r.buildingId}
                    </td>
                    <td className="p-4 font-bold text-indigo-950 font-mono text-sm">
                      {formatCurrency(r.basePrice)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        r.status === 'occupied' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : 'bg-amber-50 text-amber-700 border-amber-200/50'
                      }`}>
                        {r.status === 'occupied' ? 'Đang ở' : 'Phòng trống'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(r.id, r.name)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="room-form-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {editingRoom ? 'Cập Nhật Phòng Trọ' : 'Khai Báo Thêm Phòng Trọ'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Thuộc Tòa Nhà</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Số Phòng</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Phòng 101, Phòng M1"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Giá Thuê Niêm Yết / Tháng (đ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="Ví dụ: 4500000"
                    className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng Thái Phòng</label>
                <div className="flex items-center gap-4 mt-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="roomStatus"
                      checked={status === 'empty'}
                      onChange={() => setStatus('empty')}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    Phòng trống (Trống chờ thuê)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="roomStatus"
                      checked={status === 'occupied'}
                      onChange={() => setStatus('occupied')}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    Đang ở (Có khách)
                  </label>
                </div>
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
                  {editingRoom ? 'Lưu thay đổi' : 'Thêm Phòng'}
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
        title="Xác nhận xóa phòng trọ"
        message={`Bạn có chắc chắn muốn xóa phòng trọ "${deletingName}"? Thao tác này không thể hoàn tác.`}
      />

    </div>
  );
}
