import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import { api } from "../lib/api/client";
import type { DashboardData, BrokerCase } from "../lib/api/types";
import { Briefcase, TrendingUp, FileCheck, CheckCircle } from "lucide-react";

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

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentCases, setRecentCases] = useState<BrokerCase[]>([]);

  useEffect(() => {
    api.get("/api/dashboard").then((d: any) => setDashboard(d));
    api.get("/api/cases").then((cases: any) => setRecentCases((cases as BrokerCase[]).slice(0, 5)));
  }, []);

  const stats = dashboard
    ? [
        { label: "신규등록", value: dashboard.registeredCases, icon: Briefcase, color: "bg-Blue-50 text-Blue-600" },
        { label: "진행중", value: dashboard.inProgressCases, icon: TrendingUp, color: "bg-Green-50 text-Green-600" },
        { label: "신고완료", value: dashboard.declaredCases, icon: FileCheck, color: "bg-Blue-50 text-Blue-600" },
        { label: "통관수리", value: dashboard.acceptedCases, icon: CheckCircle, color: "bg-Green-50 text-Green-600" },
      ]
    : [];

  return (
    <Layout activeMenu={1}>
      <div className="pt-9 flex flex-col gap-6">
        {/* Page Title */}
        <h1 className="text-[24px] font-bold text-Neutral-900" style={{ fontFamily: "Pretendard" }}>
          대시보드
        </h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4 bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${s.color}`}>
                <s.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-Neutral-600 font-medium">{s.label}</p>
                <p className="text-[28px] font-bold text-Neutral-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Cases Table */}
        <TableLayout>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-Neutral-900" style={{ fontFamily: "Pretendard" }}>
                최근 케이스
              </h2>
              <span className="text-sm text-Neutral-600">
                전체 {dashboard?.totalCases ?? 0}건
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-Neutral-900 text-white">
                  <th className="px-4 py-3 text-left font-medium rounded-tl-lg">케이스번호</th>
                  <th className="px-4 py-3 text-left font-medium">화주</th>
                  <th className="px-4 py-3 text-left font-medium">운송</th>
                  <th className="px-4 py-3 text-left font-medium">통관상태</th>
                  <th className="px-4 py-3 text-left font-medium">결제상태</th>
                  <th className="px-4 py-3 text-left font-medium rounded-tr-lg">ETA</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => (
                  <tr key={c.id} className="border-b border-Neutral-200 hover:bg-Neutral-100 transition-colors">
                    <td className="px-4 py-3 font-medium text-Neutral-900">{c.caseNumber}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.clientName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.shippingMethod}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-Blue-50 text-Blue-600">
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        c.paymentStatus === "PAID" ? "bg-Green-50 text-Green-600" :
                        c.paymentStatus === "OVERDUE" ? "bg-Red-50 text-Red-600" :
                        "bg-Neutral-200 text-Neutral-700"
                      }`}>
                        {PAYMENT_LABEL[c.paymentStatus] ?? c.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-Neutral-700">{c.etaDate ?? "-"}</td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-Neutral-500">
                      등록된 케이스가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableLayout>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
            <p className="text-sm text-Neutral-600 font-medium mb-2">전체 화주</p>
            <p className="text-[28px] font-bold text-Neutral-900">{dashboard?.totalClients ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
            <p className="text-sm text-Neutral-600 font-medium mb-2">미수금 케이스</p>
            <p className="text-[28px] font-bold text-Red-600">{dashboard?.unpaidCases ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
            <p className="text-sm text-Neutral-600 font-medium mb-2">완료 케이스</p>
            <p className="text-[28px] font-bold text-Green-600">{dashboard?.completedCases ?? 0}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
