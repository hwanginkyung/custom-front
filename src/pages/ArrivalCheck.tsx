import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import { api } from "../lib/api/client";
import type { BrokerCase } from "../lib/api/types";
import { PackageCheck } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "신규등록",
  IN_PROGRESS: "진행중",
  CUSTOMS_DECLARED: "신고완료",
  CUSTOMS_ACCEPTED: "통관수리",
  ARRIVAL_CONFIRMED: "반입확인",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const STATUS_STYLE: Record<string, string> = {
  IN_PROGRESS: "bg-Blue-50 text-Blue-600",
  CUSTOMS_DECLARED: "bg-Blue-100 text-Blue-700",
  CUSTOMS_ACCEPTED: "bg-Green-50 text-Green-600",
  ARRIVAL_CONFIRMED: "bg-Green-100 text-Green-700",
};

export default function ArrivalCheck() {
  const [cases, setCases] = useState<BrokerCase[]>([]);

  const fetchCases = () => {
    api.get("/api/cases").then((data: unknown) => {
      const all = data as BrokerCase[];
      setCases(
        all.filter((c) =>
          ["CUSTOMS_ACCEPTED", "ARRIVAL_CONFIRMED", "IN_PROGRESS", "CUSTOMS_DECLARED"].includes(c.status)
        )
      );
    });
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleConfirmArrival = async (caseId: number) => {
    if (!window.confirm("반입 확인 처리하시겠습니까?")) return;
    try {
      await api.patch(`/api/cases/${caseId}`, { status: "ARRIVAL_CONFIRMED" });
      fetchCases();
    } catch (err) {
      console.error(err);
      alert("반입 확인 처리에 실패했습니다.");
    }
  };

  return (
    <Layout activeMenu={3}>
      <div className="pt-9 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h1
            className="text-[24px] font-bold text-Neutral-900"
            style={{ fontFamily: "Pretendard" }}
          >
            반입 체크
          </h1>
          <span className="text-sm text-Neutral-600">{cases.length}건</span>
        </div>

        <TableLayout>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-Neutral-900 text-white">
                <th className="px-4 py-3 text-left font-medium rounded-tl-lg">케이스번호</th>
                <th className="px-4 py-3 text-left font-medium">화주</th>
                <th className="px-4 py-3 text-left font-medium">운송</th>
                <th className="px-4 py-3 text-left font-medium">BL번호</th>
                <th className="px-4 py-3 text-left font-medium">도착항</th>
                <th className="px-4 py-3 text-left font-medium">ETA</th>
                <th className="px-4 py-3 text-left font-medium">통관상태</th>
                <th className="px-4 py-3 text-center font-medium rounded-tr-lg">반입확인</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-Neutral-200 hover:bg-Neutral-100 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-Neutral-900">{c.caseNumber}</td>
                  <td className="px-4 py-3 text-Neutral-700">{c.clientName}</td>
                  <td className="px-4 py-3 text-Neutral-700">{c.shippingMethod}</td>
                  <td className="px-4 py-3 text-Neutral-700">{c.blNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-Neutral-700">{c.arrivalPort ?? "-"}</td>
                  <td className="px-4 py-3 text-Neutral-700">{c.etaDate ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        STATUS_STYLE[c.status] ?? "bg-Neutral-200 text-Neutral-700"
                      }`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.status === "CUSTOMS_ACCEPTED" ? (
                      <button
                        onClick={() => handleConfirmArrival(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-Brand-2 text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
                      >
                        <PackageCheck size={14} />
                        반입 확인
                      </button>
                    ) : c.status === "ARRIVAL_CONFIRMED" ? (
                      <span className="text-xs text-Green-600 font-medium">확인완료</span>
                    ) : (
                      <span className="text-xs text-Neutral-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-Neutral-500">
                    반입 체크 대상 케이스가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableLayout>
      </div>
    </Layout>
  );
}
