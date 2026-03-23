import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import { api } from "../lib/api/client";
import type { BrokerCase } from "../lib/api/types";
import { ChevronRight, ArrowLeft } from "lucide-react";

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

const STEPS = ["신규등록", "통관진행", "신고완료", "통관수리완료"];

function getStepIndex(status: string): number {
  switch (status) {
    case "REGISTERED": return 0;
    case "IN_PROGRESS": return 1;
    case "CUSTOMS_DECLARED": return 2;
    case "CUSTOMS_ACCEPTED":
    case "ARRIVAL_CONFIRMED":
    case "COMPLETED": return 3;
    default: return 0;
  }
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<BrokerCase | null>(null);

  useEffect(() => {
    if (id) {
      api.get(`/api/cases/${id}`).then((d: any) => setCaseData(d as BrokerCase));
    }
  }, [id]);

  if (!caseData) {
    return (
      <Layout activeMenu={2}>
        <div className="pt-9 flex items-center justify-center text-Neutral-500">로딩 중...</div>
      </Layout>
    );
  }

  const stepIndex = getStepIndex(caseData.status);

  return (
    <Layout activeMenu={2}>
      <div className="pt-9 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-Neutral-600">
          <span className="cursor-pointer hover:text-Brand-2" onClick={() => navigate("/cases")}>케이스 관리</span>
          <ChevronRight size={14} />
          <span className="text-Neutral-900 font-medium">{caseData.caseNumber}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cases")} className="p-1 hover:bg-Neutral-200 rounded-md transition-colors">
              <ArrowLeft size={20} className="text-Neutral-700" />
            </button>
            <h1 className="text-[24px] font-bold text-Neutral-900" style={{ fontFamily: "Pretendard" }}>
              {caseData.caseNumber}
            </h1>
            <span className="px-3 py-1 rounded-md text-sm font-medium bg-Blue-50 text-Blue-600">
              {STATUS_LABEL[caseData.status] ?? caseData.status}
            </span>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= stepIndex ? "bg-Brand-2 text-white" : "bg-Neutral-300 text-Neutral-600"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i <= stepIndex ? "text-Brand-2" : "text-Neutral-500"}`}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-3 ${i < stepIndex ? "bg-Brand-2" : "bg-Neutral-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* 담당자 & 결제 */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
            <h3 className="text-[16px] font-bold text-Neutral-900 mb-4">기본 정보</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">화주</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">운송방법</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.shippingMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">결제상태</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  caseData.paymentStatus === "PAID" ? "bg-Green-50 text-Green-600" :
                  caseData.paymentStatus === "OVERDUE" ? "bg-Red-50 text-Red-600" :
                  "bg-Neutral-200 text-Neutral-700"
                }`}>
                  {PAYMENT_LABEL[caseData.paymentStatus] ?? caseData.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">메모</span>
                <span className="text-sm text-Neutral-700">{caseData.memo ?? "-"}</span>
              </div>
            </div>
          </div>

          {/* 청구 */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
            <h3 className="text-[16px] font-bold text-Neutral-900 mb-4">청구 정보</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">물품가액</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.totalAmount?.toLocaleString() ?? "-"} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">관세</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.dutyAmount?.toLocaleString() ?? "-"} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">부가세</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.vatAmount?.toLocaleString() ?? "-"} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">수수료</span>
                <span className="text-sm font-medium text-Neutral-900">{caseData.brokerageFee?.toLocaleString() ?? "-"} 원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 통관 데이터 */}
        <TableLayout>
          <div className="flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-Neutral-900">통관 데이터</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">BL/AWB 번호</span>
                <span className="text-sm text-Neutral-900">{caseData.blNumber ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">출발항</span>
                <span className="text-sm text-Neutral-900">{caseData.departurePorts ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">도착항</span>
                <span className="text-sm text-Neutral-900">{caseData.arrivalPort ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">ETA</span>
                <span className="text-sm text-Neutral-900">{caseData.etaDate ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">ATA</span>
                <span className="text-sm text-Neutral-900">{caseData.ataDate ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">통관일</span>
                <span className="text-sm text-Neutral-900">{caseData.customsDate ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-Neutral-600">반출일</span>
                <span className="text-sm text-Neutral-900">{caseData.releaseDate ?? "-"}</span>
              </div>
            </div>
          </div>
        </TableLayout>

        {/* Cargo Table */}
        {caseData.cargos && caseData.cargos.length > 0 && (
          <TableLayout>
            <div className="flex flex-col gap-4">
              <h3 className="text-[16px] font-bold text-Neutral-900">화물 목록</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-Neutral-900 text-white">
                    <th className="px-4 py-3 text-left font-medium rounded-tl-lg">품명</th>
                    <th className="px-4 py-3 text-left font-medium">HS Code</th>
                    <th className="px-4 py-3 text-right font-medium">수량</th>
                    <th className="px-4 py-3 text-left font-medium">단위</th>
                    <th className="px-4 py-3 text-right font-medium">단가</th>
                    <th className="px-4 py-3 text-right font-medium">총액</th>
                    <th className="px-4 py-3 text-right font-medium">중량(kg)</th>
                    <th className="px-4 py-3 text-left font-medium rounded-tr-lg">원산지</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.cargos.map((cargo) => (
                    <tr key={cargo.id} className="border-b border-Neutral-200">
                      <td className="px-4 py-3 text-Neutral-900">{cargo.itemName}</td>
                      <td className="px-4 py-3 text-Neutral-700">{cargo.hsCode}</td>
                      <td className="px-4 py-3 text-right text-Neutral-700">{cargo.quantity}</td>
                      <td className="px-4 py-3 text-Neutral-700">{cargo.unit}</td>
                      <td className="px-4 py-3 text-right text-Neutral-700">{cargo.unitPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-Neutral-700">{cargo.totalPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-Neutral-700">{cargo.weight}</td>
                      <td className="px-4 py-3 text-Neutral-700">{cargo.originCountry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableLayout>
        )}
      </div>
    </Layout>
  );
}
