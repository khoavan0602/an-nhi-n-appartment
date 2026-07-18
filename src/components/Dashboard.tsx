import { useState, useMemo } from 'react';
import { Building, Room, Expense, Invoice, formatCurrency } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Calendar, 
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';

interface DashboardProps {
  buildings: Building[];
  rooms: Room[];
  expenses: Expense[];
  invoices: Invoice[];
}

export default function Dashboard({ buildings, rooms, expenses, invoices }: DashboardProps) {
  // Extract all unique years from invoices and expenses, default to current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    invoices.forEach(inv => yearsSet.add(inv.year));
    expenses.forEach(exp => {
      if (exp.date) {
        const yr = new Date(exp.date).getFullYear();
        if (!isNaN(yr)) yearsSet.add(yr);
      }
    });
    // Add current year if empty
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [invoices, expenses]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears[0] || new Date().getFullYear();
  });

  const [drillDownMonth, setDrillDownMonth] = useState<number | null>(null);
  
  // Custom states for yearly data export
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [printYearlyReportOpen, setPrintYearlyReportOpen] = useState(false);

  // Filter financial data by selected year
  const yearData = useMemo(() => {
    const filteredInvoices = invoices.filter(inv => inv.year === selectedYear);
    const filteredExpenses = expenses.filter(exp => {
      if (!exp.date) return false;
      return new Date(exp.date).getFullYear() === selectedYear;
    });

    const revenueExpected = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount - inv.discountPrice, 0);
    const revenuePaid = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = revenuePaid - totalExpenses;
    const profitMargin = revenuePaid > 0 ? (netProfit / revenuePaid) * 100 : 0;

    return {
      revenueExpected,
      revenuePaid,
      totalExpenses,
      netProfit,
      profitMargin,
      filteredInvoices,
      filteredExpenses
    };
  }, [selectedYear, invoices, expenses]);

  // Compute 12 months data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return months.map(m => {
      const monthInvoices = yearData.filteredInvoices.filter(inv => inv.month === m);
      const monthExpenses = yearData.filteredExpenses.filter(exp => {
        if (!exp.date) return false;
        // Date parsing is safe with YYYY-MM-DD
        return new Date(exp.date).getMonth() + 1 === m;
      });

      const revExpected = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount - inv.discountPrice, 0);
      const revPaid = monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const expAmount = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const net = revPaid - expAmount;

      return {
        month: m,
        revenueExpected: revExpected,
        revenuePaid: revPaid,
        expense: expAmount,
        netProfit: net,
        invoices: monthInvoices,
        expenses: monthExpenses
      };
    });
  }, [yearData, selectedYear]);

  // Drilled down month data
  const drilledMonthData = useMemo(() => {
    if (drillDownMonth === null) return null;
    return monthlyData.find(m => m.month === drillDownMonth) || null;
  }, [drillDownMonth, monthlyData]);

  // Map room IDs to room names for drill-down displaying
  const roomNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    rooms.forEach(r => {
      const building = buildings.find(b => b.id === r.buildingId);
      map[r.id] = building ? `${r.name} (${building.name})` : r.name;
    });
    return map;
  }, [rooms, buildings]);

  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // Add UTF-8 BOM for Excel support
    
    // Title
    csvContent += `AN NHIÊN APPARTMENT - BÁO CÁO TÀI CHÍNH CHI TIẾT NĂM ${selectedYear}\n`;
    csvContent += `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}\n\n`;
    
    // Section 1: KPI Overview
    csvContent += `1. TỔNG QUAN CHỈ SỐ CẢ NĂM\n`;
    csvContent += `Doanh Thu Dự Kiến (Kỳ Vọng),Doanh Thu Thực Thu (Thực Nhận),Chi Phí Vận Hành,Lợi Nhuận Ròng,Hiệu Suất Sinh Lời (%)\n`;
    csvContent += `"${yearData.revenueExpected}","${yearData.revenuePaid}","${yearData.totalExpenses}","${yearData.netProfit}","${yearData.profitMargin.toFixed(2)}%"\n\n`;
    
    // Section 2: Monthly Cash Flow
    csvContent += `2. DÒNG TIỀN CHI TIẾT 12 THÁNG\n`;
    csvContent += `Tháng,Doanh Thu Dự Kiến,Doanh Thu Thực Thu,Chi Phí Vận Hành,Lợi Nhuận Ròng\n`;
    monthlyData.forEach(row => {
      csvContent += `"Tháng ${row.month}","${row.revenueExpected}","${row.revenuePaid}","${row.expense}","${row.netProfit}"\n`;
    });
    csvContent += `\n`;
    
    // Section 3: Detailed Invoices
    csvContent += `3. DANH SÁCH HÓA ĐƠN THU TIỀN CHI TIẾT TRONG NĂM\n`;
    csvContent += `Phòng,Kỳ Thu Hoá Đơn,Tổng Số Tiền Dự Kiến,Số Tiền Thực Thu,Giảm Giá,Trạng Thái,Ghi Chú\n`;
    
    // Sort invoices by room and month
    const sortedInvoices = [...yearData.filteredInvoices].sort((a, b) => {
      const roomA = roomNameMap[a.roomId] || '';
      const roomB = roomNameMap[b.roomId] || '';
      if (roomA !== roomB) return roomA.localeCompare(roomB);
      return a.month - b.month;
    });

    sortedInvoices.forEach(inv => {
      const rName = roomNameMap[inv.roomId] || inv.roomId;
      const cycle = `Tháng ${inv.month}/${inv.year}`;
      const expected = inv.totalAmount - inv.discountPrice;
      const actual = inv.paidAmount;
      const discount = inv.discountPrice;
      const statusText = inv.status === 'paid' ? 'Thu Đủ' : inv.status === 'partially_paid' ? 'Thu Một Phần' : 'Chưa Thu';
      const notes = (inv.notes || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csvContent += `"${rName}","${cycle}","${expected}","${actual}","${discount}","${statusText}","${notes}"\n`;
    });
    csvContent += `\n`;
    
    // Section 4: Detailed Expenses
    csvContent += `4. DANH SÁCH CHI PHÍ VẬN HÀNH CHI TIẾT TRONG NĂM\n`;
    csvContent += `Ngày Chi,Hạng Mục Chi,Số Tiền Chi,Phạm Vi Áp Dụng,Mô Tả Chi Tiết\n`;
    
    const sortedExpenses = [...yearData.filteredExpenses].sort((a, b) => a.date.localeCompare(b.date));
    sortedExpenses.forEach(exp => {
      let scope = 'Hệ thống chung';
      if (exp.roomId) {
        scope = `Phòng: ${roomNameMap[exp.roomId] || exp.roomId}`;
      } else if (exp.buildingId) {
        const b = buildings.find(bld => bld.id === exp.buildingId);
        scope = `Tòa: ${b ? b.name : exp.buildingId}`;
      }
      const desc = (exp.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const category = (exp.category || '').replace(/"/g, '""');
      csvContent += `"${exp.date}","${category}","${exp.amount}","${scope}","${desc}"\n`;
    });
    
    // Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `An_Nhien_Appartment_Bao_Cao_Nam_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header section with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="dash-title">Báo Cáo Hoạt Động & Tài Chính</h1>
          <p className="text-xs text-slate-500 mt-1">Giám sát doanh thu thực tế, chi phí vận hành và lợi nhuận ròng của chuỗi nhà trọ dòng tiền.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Năm tài chính:</span>
          <select
            id="dash-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>

          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            id="export-yearly-data-btn"
          >
            <Download className="w-3.5 h-3.5 animate-bounce-slow" />
            <span>Xuất báo cáo năm</span>
          </button>
        </div>
      </div>

      {/* Corporate Financial KPIs - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="dash-kpi-grid">
        {/* KPI 1: Real Revenue / Expected */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow" id="kpi-revenue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Thu Thực Thu</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{formatCurrency(yearData.revenuePaid)}</h3>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>Mục tiêu hóa đơn: </span>
              <span className="font-semibold font-mono text-slate-700">{formatCurrency(yearData.revenueExpected)}</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Expected Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow" id="kpi-expected">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Thu Kỳ Vọng</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{formatCurrency(yearData.revenueExpected)}</h3>
            <p className="mt-2 text-[11px] text-slate-500">
              Tổng số tiền hóa đơn đã xuất trong năm.
            </p>
          </div>
        </div>

        {/* KPI 3: Operational Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow" id="kpi-expenses">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi Phí Vận Hành</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900">{formatCurrency(yearData.totalExpenses)}</h3>
            <p className="mt-2 text-[11px] text-slate-500">
              Bảo trì, sửa chữa, thuế và vận hành chuỗi.
            </p>
          </div>
        </div>

        {/* KPI 4: Net Profit & Margin */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow" id="kpi-netprofit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lợi Nhuận Ròng (Net)</span>
            <div className={`rounded-lg p-2 ${yearData.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {yearData.netProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${yearData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(yearData.netProfit)}
            </h3>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>Hiệu suất sinh lời: </span>
              <span className={`font-semibold font-mono ${yearData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {yearData.profitMargin.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Cashflow Table 12 months */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="dash-flow-table-container">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Báo Cáo Chi Tiết Dòng Tiền 12 Tháng</h2>
            <p className="text-xs text-slate-500 mt-0.5">Nhấp vào một dòng bất kỳ để xem danh sách thu chi chi tiết.</p>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Click dòng để drill-down</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" id="dash-flow-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Tháng</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Dự Kiến</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Thực Thu</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Chi Phí Vận Hành</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Lợi Nhuận Ròng</th>
                <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map(row => (
                <tr 
                  key={row.month} 
                  onClick={() => setDrillDownMonth(row.month)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-bold text-slate-800">Tháng {row.month}</td>
                  <td className="p-4 font-mono text-slate-600">{formatCurrency(row.revenueExpected)}</td>
                  <td className="p-4 font-mono font-semibold text-emerald-600">{formatCurrency(row.revenuePaid)}</td>
                  <td className="p-4 font-mono text-rose-600">{formatCurrency(row.expense)}</td>
                  <td className="p-4">
                    <span className={`font-mono font-bold ${row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(row.netProfit)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrillDownMonth(row.month);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all group-hover:scale-105 cursor-pointer"
                    >
                      Chi tiết <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal overlay */}
      {drillDownMonth !== null && drilledMonthData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto" id="drilldown-modal">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi Tiết Giao Dịch Thu Chi — Tháng {drillDownMonth}/{selectedYear}</h3>
                <p className="text-xs text-slate-500 mt-1">Báo cáo dòng thu chi thực tế đã kiểm kê trong tháng.</p>
              </div>
              <button 
                onClick={() => setDrillDownMonth(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                id="close-drilldown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Block 1: Month summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Thực Thu Hóa Đơn</span>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatCurrency(drilledMonthData.revenuePaid)}</div>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Kỳ vọng: <span className="font-mono">{formatCurrency(drilledMonthData.revenueExpected)}</span></span>
                </div>
                <div className="bg-rose-50/30 rounded-xl p-4 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Chi Phí Vận Hành</span>
                  <div className="text-lg font-bold font-mono text-rose-700 mt-1">{formatCurrency(drilledMonthData.expense)}</div>
                  <span className="text-[10px] text-rose-600 block mt-0.5">Tổng số khoản chi: {drilledMonthData.expenses.length}</span>
                </div>
                <div className={`rounded-xl p-4 border ${drilledMonthData.netProfit >= 0 ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${drilledMonthData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Lợi Nhuận Ròng
                  </span>
                  <div className={`text-lg font-bold font-mono mt-1 ${drilledMonthData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(drilledMonthData.netProfit)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Doanh thu - Chi phí</span>
                </div>
              </div>

              {/* Block 2: Invoices details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  1. Danh sách Hóa đơn thu tiền trọ ({drilledMonthData.invoices.length} hóa đơn)
                </h4>
                {drilledMonthData.invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-6 text-center border border-slate-100">Chưa phát sinh hóa đơn nào trong tháng này.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Phòng</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Tổng Tiền</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Thực Thu</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {drilledMonthData.invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{roomNameMap[inv.roomId] || inv.roomId}</td>
                            <td className="p-3 text-slate-700 font-mono font-medium">{formatCurrency(inv.totalAmount - inv.discountPrice)}</td>
                            <td className="p-3 text-emerald-600 font-mono font-semibold">{formatCurrency(inv.paidAmount)}</td>
                            <td className="p-3">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                inv.status === 'partially_paid' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {inv.status === 'paid' ? 'Thu Đủ' :
                                 inv.status === 'partially_paid' ? 'Thu Một Phần' : 'Chưa Thu'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 max-w-xs truncate">{inv.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Block 3: Expenses details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  2. Danh sách Khoản chi vận hành ({drilledMonthData.expenses.length} khoản chi)
                </h4>
                {drilledMonthData.expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-6 text-center border border-slate-100">Không có khoản chi vận hành nào được ghi nhận trong tháng này.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Ngày Chi</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Danh Mục</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Số Tiền</th>
                          <th className="p-3 font-bold text-slate-500 uppercase tracking-wider">Chi Tiết / Mục Tiêu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {drilledMonthData.expenses.map(exp => {
                          let targetName = 'Hệ thống chung';
                          if (exp.roomId) {
                            targetName = `Phòng: ${roomNameMap[exp.roomId] || exp.roomId}`;
                          } else if (exp.buildingId) {
                            const b = buildings.find(bld => bld.id === exp.buildingId);
                            targetName = `Tòa: ${b ? b.name : exp.buildingId}`;
                          }

                          return (
                            <tr key={exp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-600 font-mono">{exp.date}</td>
                              <td className="p-3 font-semibold text-slate-800">{exp.category}</td>
                              <td className="p-3 text-rose-600 font-mono font-semibold">{formatCurrency(exp.amount)}</td>
                              <td className="p-3 text-slate-600">
                                <span className="block font-medium">{exp.description}</span>
                                <span className="block text-[10px] text-slate-400">Áp dụng: {targetName}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50/50">
              <button 
                onClick={() => setDrillDownMonth(null)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Đóng Báo Cáo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 1. Export Format Selection Dialog */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print" id="yearly-export-format-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600 animate-bounce-slow" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Xuất Dữ Liệu Năm {selectedYear}</h3>
              </div>
              <button 
                onClick={() => setExportModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Vui lòng lựa chọn định dạng tệp báo cáo bạn muốn tải về hoặc in ấn cho năm tài chính <strong className="text-indigo-600 font-bold">{selectedYear}</strong>:
              </p>

              <div className="space-y-3 pt-2">
                {/* Option 1: Excel CSV */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                    setExportModalOpen(false);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-emerald-700">Xuất File Excel (.CSV)</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-normal">
                      Chứa báo cáo dòng tiền 12 tháng, danh sách chi tiết tất cả hóa đơn thu tiền trọ và chi phí vận hành kèm chú thích đầy đủ.
                    </span>
                  </div>
                </button>

                {/* Option 2: PDF Printout */}
                <button
                  type="button"
                  onClick={() => {
                    setExportModalOpen(false);
                    setPrintYearlyReportOpen(true);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-indigo-700">Xem &amp; In File PDF Báo Cáo</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-normal">
                      Thiết kế dạng trang A4 tiêu chuẩn, bố cục rõ ràng, hỗ trợ ký tên bàn giao, phù hợp làm báo cáo cuối năm gửi đối tác.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Detailed Printable Yearly Report Modal */}
      {printYearlyReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in" id="yearly-report-dialog">
          {/* Inject style rule to hide normal UI during print */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              body {
                background-color: white !important;
                color: black !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-yearly-report-area, #printable-yearly-report-area * {
                visibility: visible !important;
              }
              #printable-yearly-report-area {
                visibility: visible !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }
              /* Hide modal wrappers and buttons */
              #app-root, #main-app-container, #app-stage, #yearly-report-dialog, #yearly-report-dialog > div {
                height: 0 !important;
                min-height: 0 !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}} />

          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col border border-slate-200">
            {/* Modal Header inside Modal overlay */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Xem &amp; In Báo Cáo Tài Chính Thường Niên</h3>
              </div>
              <button 
                onClick={() => setPrintYearlyReportOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Containing the printable A4 sheet */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100/50 no-print">
              {/* This is the pristine white printable document page */}
              <div 
                id="printable-yearly-report-area"
                className="w-full max-w-3xl mx-auto bg-white shadow-lg border border-slate-200 rounded-none p-10 font-sans text-slate-800"
              >
                {/* Document Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">AN NHIÊN APPARTMENT</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Hệ thống quản lý vận hành phòng trọ &amp; căn hộ dịch vụ</p>
                    <p className="text-[10px] text-slate-500 mt-1">SĐT: 0909.123.456 - Email: dangvankhoa0602@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 rounded-full uppercase tracking-wider">NĂM TÀI CHÍNH {selectedYear}</span>
                    <p className="text-[9px] text-slate-400 mt-1.5">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center my-8">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h2>
                  <p className="text-[11px] text-slate-500 mt-1 italic font-medium">Toàn bộ doanh thu thực tế, chi phí vận hành và lợi nhuận ròng năm {selectedYear}</p>
                </div>

                {/* Section 1: KPI Stats Panel */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Kỳ Vọng</span>
                    <span className="block text-xs font-bold font-mono text-slate-900 mt-1">{formatCurrency(yearData.revenueExpected)}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded text-center">
                    <span className="block text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Thực Thu Hoàn Tất</span>
                    <span className="block text-xs font-bold font-mono text-emerald-700 mt-1">{formatCurrency(yearData.revenuePaid)}</span>
                  </div>
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded text-center">
                    <span className="block text-[8px] font-bold text-rose-700 uppercase tracking-wider">Chi Phí Vận Hành</span>
                    <span className="block text-xs font-bold font-mono text-rose-700 mt-1">{formatCurrency(yearData.totalExpenses)}</span>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded text-center">
                    <span className="block text-[8px] font-bold text-indigo-700 uppercase tracking-wider">Lợi Nhuận Ròng (Net)</span>
                    <span className="block text-xs font-extrabold font-mono text-indigo-700 mt-1">{formatCurrency(yearData.netProfit)}</span>
                  </div>
                </div>

                {/* Section 2: Portfolio Overview & Capacity */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg text-[10px] mb-8 border border-slate-100">
                  <div className="space-y-1.5">
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[8px]">Thông tin hạ tầng vận hành:</span>
                    <div>
                      <span className="text-slate-500">Số lượng tòa nhà sở hữu:</span>{' '}
                      <span className="font-bold text-slate-800">{buildings.length} tòa</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Quy mô tổng số phòng trọ:</span>{' '}
                      <span className="font-bold text-slate-800">{rooms.length} phòng kinh doanh</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-l border-slate-200 pl-6">
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[8px]">Thống kê chứng từ kế toán:</span>
                    <div>
                      <span className="text-slate-500">Tổng hóa đơn thu chi phát sinh:</span>{' '}
                      <span className="font-bold text-slate-800">{yearData.filteredInvoices.length} hóa đơn</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Số lượng biên lai chi phí:</span>{' '}
                      <span className="font-bold text-slate-800">{yearData.filteredExpenses.length} khoản chi được duyệt</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Monthly Breakdown Table */}
                <div className="space-y-3 mb-8">
                  <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">Bảng dòng tiền chi tiết 12 tháng</h3>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-50">
                        <th className="py-2 px-1 font-bold text-slate-800">Tháng</th>
                        <th className="py-2 px-1 font-bold text-slate-800 text-right">Doanh Thu Kỳ Vọng</th>
                        <th className="py-2 px-1 font-bold text-slate-800 text-right">Doanh Thu Thực Thu</th>
                        <th className="py-2 px-1 font-bold text-slate-800 text-right">Chi Phí Vận Hành</th>
                        <th className="py-2 px-1 font-bold text-slate-800 text-right">Lợi Nhuận Ròng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {monthlyData.map(row => (
                        <tr key={row.month} className="hover:bg-slate-50/50">
                          <td className="py-2 px-1 font-sans font-bold text-slate-800">Tháng {row.month}</td>
                          <td className="py-2 px-1 text-right text-slate-600">{formatCurrency(row.revenueExpected)}</td>
                          <td className="py-2 px-1 text-right font-semibold text-emerald-600">{formatCurrency(row.revenuePaid)}</td>
                          <td className="py-2 px-1 text-right text-rose-600">{formatCurrency(row.expense)}</td>
                          <td className="py-2 px-1 text-right font-bold text-indigo-600">{formatCurrency(row.netProfit)}</td>
                        </tr>
                      ))}
                      {/* Subtotal row */}
                      <tr className="border-t-2 border-slate-900 bg-slate-100/50 font-bold font-mono">
                        <td className="py-3 px-1 font-sans text-slate-900 uppercase tracking-wider">Cộng dồn cả năm</td>
                        <td className="py-3 px-1 text-right text-slate-900">{formatCurrency(yearData.revenueExpected)}</td>
                        <td className="py-3 px-1 text-right text-emerald-700">{formatCurrency(yearData.revenuePaid)}</td>
                        <td className="py-3 px-1 text-right text-rose-700">{formatCurrency(yearData.totalExpenses)}</td>
                        <td className="py-3 px-1 text-right text-indigo-700">{formatCurrency(yearData.netProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 4: General Disclaimer / Review */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-[9px] leading-relaxed text-slate-500 mb-12">
                  <strong>Điều khoản &amp; Cam kết:</strong> Báo cáo tài chính này được tổng hợp và tính toán hoàn toàn tự động dựa trên hóa đơn thực tế và chi phí phát sinh được lưu trữ bảo mật trên hệ thống An Nhiên Appartment. Mọi số liệu đối soát điện nước, giảm trừ khuyến mãi và công nợ đều trùng khớp tuyệt đối với sổ sách chứng từ bàn giao gốc của từng tòa nhà trực thuộc.
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 text-center text-[10px] font-semibold gap-4 h-28">
                  <div>
                    <span className="block mb-16">Đại Diện Ban Quản Lý (Ký, ghi rõ họ tên)</span>
                    <span className="block text-slate-400 italic">Ban Quản Lý An Nhiên</span>
                  </div>
                  <div>
                    <span className="block mb-16">Người Lập Báo Cáo (Ký, ghi rõ họ tên)</span>
                    <span className="block text-slate-400 italic">Ban Quản Lý An Nhiên</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer inside Modal overlay (Non-printable) */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => setPrintYearlyReportOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Báo Cáo (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
