import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Upload } from "lucide-react";
import Layout from "../component/layout/Layout";
import TablePager from "../component/TablePager";
import { api } from "../lib/api/client";
import type { BrokerCase, CaseStatus, PaymentStatus } from "../lib/api/types";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<CaseStatus, string> = {
  REGISTERED: "신규",
  IN_PROGRESS: "진행중",
  CUSTOMS_DECLARED: "신고 완료",
  CUSTOMS_ACCEPTED: "통관 수리",
  ARRIVAL_CONFIRMED: "반입 확인",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "미완료",
  PAID: "완료",
  OVERDUE: "연체",
};

const DECLARE_TYPE_LABEL: Record<BrokerCase["shippingMethod"], string> = {
  SEA: "Container",
  AIR: "Air",
  LAND: "Land",
  COURIER: "Courier",
};

function toDateLabel(value?: string): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function getArrivalLabel(status: CaseStatus): string {
  return status === "ARRIVAL_CONFIRMED" || status === "COMPLETED" ? "Yes" : "No";
}

type FilterSelectProps = {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
};

function FilterSelect({ value, options, placeholder, onChange }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[38px] rounded-[10px] border border-[#D8DDE3] bg-white px-3 text-sm text-[#2C3138]"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function Cases() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BrokerCase[]>([]);
  const [page, setPage] = useState(1);
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  useEffect(() => {
    api.get("/api/cases").then((data: unknown) => setRows(data as BrokerCase[]));
  }, []);

  const clientOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.clientName).filter(Boolean))).sort(),
    [rows],
  );

  const assigneeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => String(row.assigneeId ?? "-")))).sort(),
    [rows],
  );

  const statusOptions = useMemo(
    () => (Object.keys(STATUS_LABEL) as CaseStatus[]).map((status) => STATUS_LABEL[status]),
    [],
  );

  const paymentOptions = useMemo(
    () => (Object.keys(PAYMENT_LABEL) as PaymentStatus[]).map((status) => PAYMENT_LABEL[status]),
    [],
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (clientFilter && row.clientName !== clientFilter) return false;
      if (statusFilter && STATUS_LABEL[row.status] !== statusFilter) return false;
      if (paymentFilter && PAYMENT_LABEL[row.paymentStatus] !== paymentFilter) return false;
      if (assigneeFilter && String(row.assigneeId ?? "-") !== assigneeFilter) return false;
      return true;
    });
  }, [rows, clientFilter, statusFilter, paymentFilter, assigneeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <Layout activeMenu={2}>
      <div className="flex w-full flex-col items-start gap-[10px] px-[8px] pb-[154px] pt-[54px]">
        <section className="w-full rounded-2xl bg-white px-8 py-8 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mr-1 text-[40px] font-semibold leading-none text-[#191B1F]">케이스 목록</h1>
              <FilterSelect
                value={clientFilter}
                options={clientOptions}
                placeholder="화주"
                onChange={setClientFilter}
              />
              <FilterSelect
                value={statusFilter}
                options={statusOptions}
                placeholder="전체 통관상태"
                onChange={setStatusFilter}
              />
              <FilterSelect
                value={paymentFilter}
                options={paymentOptions}
                placeholder="전체 결제상태"
                onChange={setPaymentFilter}
              />
              <FilterSelect
                value={assigneeFilter}
                options={assigneeOptions}
                placeholder="전체 담당자"
                onChange={setAssigneeFilter}
              />
            </div>

            <button
              type="button"
              className="inline-flex h-[44px] items-center gap-2 rounded-[10px] bg-[#1F4ED8] px-5 text-sm font-semibold text-white hover:bg-[#173eb1]"
            >
              <Upload size={16} />
              신고필증 업로드
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="min-w-[1200px] w-full text-[15px]">
              <thead>
                <tr className="bg-[#061334] text-white">
                  <th className="px-4 py-4 text-left font-medium">케이스 번호</th>
                  <th className="px-4 py-4 text-left font-medium">화주</th>
                  <th className="px-4 py-4 text-left font-medium">목적국</th>
                  <th className="px-4 py-4 text-left font-medium">통관 상태</th>
                  <th className="px-4 py-4 text-left font-medium">신고 구분</th>
                  <th className="px-4 py-4 text-left font-medium">반입 여부</th>
                  <th className="px-4 py-4 text-left font-medium">결제 상태</th>
                  <th className="px-4 py-4 text-left font-medium">담당자</th>
                  <th className="px-4 py-4 text-left font-medium">신규 등록일</th>
                  <th className="px-4 py-4 text-center font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/cases/${row.id}`)}
                    className="cursor-pointer border-b border-[#E9EDF2] bg-white hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-5 font-medium text-[#202632]">{row.caseNumber}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{row.clientName}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{row.arrivalPort || "-"}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{STATUS_LABEL[row.status]}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{DECLARE_TYPE_LABEL[row.shippingMethod]}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{getArrivalLabel(row.status)}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{PAYMENT_LABEL[row.paymentStatus]}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{row.assigneeId ? `#${row.assigneeId}` : "-"}</td>
                    <td className="px-4 py-5 text-[#2F3640]">{toDateLabel(row.createdAt)}</td>
                    <td className="px-4 py-5 text-center">
                      <button
                        type="button"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#FF5C5C] hover:bg-[#FFF1F1]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-14 text-center text-[#667085]">
                      표시할 케이스가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-7">
            <TablePager currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </section>
      </div>
    </Layout>
  );
}
