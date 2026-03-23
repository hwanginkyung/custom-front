import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import TablePager from "../component/TablePager";
import DropdownInput from "../component/inputs/DropdownInput";
import SearchInput from "../component/inputs/SearchInput";
import { api } from "../lib/api/client";
import type { BrokerCase } from "../lib/api/types";
import { Plus } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "신규등록",
  IN_PROGRESS: "진행중",
  CUSTOMS_DECLARED: "신고완료",
  CUSTOMS_ACCEPTED: "통관수리",
  ARRIVAL_CONFIRMED: "반입확인",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "미수금",
  PAID: "수금완료",
  OVERDUE: "연체",
};

const STATUS_STYLE: Record<string, string> = {
  REGISTERED: "bg-Neutral-200 text-Neutral-700",
  IN_PROGRESS: "bg-Blue-50 text-Blue-600",
  CUSTOMS_DECLARED: "bg-Blue-100 text-Blue-700",
  CUSTOMS_ACCEPTED: "bg-Green-50 text-Green-600",
  ARRIVAL_CONFIRMED: "bg-Green-100 text-Green-700",
  COMPLETED: "bg-Green-50 text-Green-700",
  CANCELLED: "bg-Red-50 text-Red-600",
};

const PAYMENT_STYLE: Record<string, string> = {
  UNPAID: "bg-Neutral-200 text-Neutral-700",
  PAID: "bg-Green-50 text-Green-600",
  OVERDUE: "bg-Red-50 text-Red-600",
};

const PAGE_SIZE = 10;

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<BrokerCase[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  useEffect(() => {
    api.get("/api/cases").then((data: any) => setCases(data as BrokerCase[]));
  }, []);

  const filtered = cases.filter((c) => {
    if (search && !c.caseNumber.includes(search) && !c.clientName.includes(search)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (paymentFilter && c.paymentStatus !== paymentFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout activeMenu={2}>
      <div className="pt-9 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-Neutral-900" style={{ fontFamily: "Pretendard" }}>
            케이스 관리
          </h1>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-Brand-2 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus size={18} />
            새 케이스
          </button>
        </div>

        <TableLayout>
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="w-[200px]">
                <SearchInput placeholder="케이스번호 / 화주 검색" value={search} onChange={setSearch} />
              </div>
              <div className="w-[160px]">
                <DropdownInput
                  options={["", "REGISTERED", "IN_PROGRESS", "CUSTOMS_DECLARED", "CUSTOMS_ACCEPTED", "ARRIVAL_CONFIRMED", "COMPLETED", "CANCELLED"]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="전체 통관상태"
                />
              </div>
              <div className="w-[140px]">
                <DropdownInput
                  options={["", "UNPAID", "PAID", "OVERDUE"]}
                  value={paymentFilter}
                  onChange={setPaymentFilter}
                  placeholder="전체 결제상태"
                />
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-Neutral-900 text-white">
                  <th className="px-4 py-3 text-left font-medium rounded-tl-lg">케이스번호</th>
                  <th className="px-4 py-3 text-left font-medium">화주</th>
                  <th className="px-4 py-3 text-left font-medium">운송</th>
                  <th className="px-4 py-3 text-left font-medium">BL번호</th>
                  <th className="px-4 py-3 text-left font-medium">통관상태</th>
                  <th className="px-4 py-3 text-left font-medium">결제상태</th>
                  <th className="px-4 py-3 text-left font-medium">ETA</th>
                  <th className="px-4 py-3 text-left font-medium rounded-tr-lg">물품가액</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="border-b border-Neutral-200 hover:bg-Neutral-100 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-Neutral-900">{c.caseNumber}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.clientName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.shippingMethod}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.blNumber ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_STYLE[c.status] ?? ""}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${PAYMENT_STYLE[c.paymentStatus] ?? ""}`}>
                        {PAYMENT_LABEL[c.paymentStatus] ?? c.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-Neutral-700">{c.etaDate ?? "-"}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.totalAmount?.toLocaleString() ?? "-"}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-Neutral-500">
                      등록된 케이스가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <TablePager currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </TableLayout>
      </div>
    </Layout>
  );
}
