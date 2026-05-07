import { type ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Download, Eye, FileText, Pencil } from "lucide-react";
import Layout from "../component/layout/Layout";
import { api } from "../lib/api/client";
import type { BrokerCase, Cargo, PaymentStatus, ShippingMethod } from "../lib/api/types";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "신규 등록",
  IN_PROGRESS: "검토 (담당자 배정)",
  CUSTOMS_DECLARED: "신고 진행",
  CUSTOMS_ACCEPTED: "통관 수리",
  ARRIVAL_CONFIRMED: "반입 확인",
  COMPLETED: "완료(필증 업로드)",
  CANCELLED: "취소",
};

const SHIPPING_LABEL: Record<ShippingMethod, string> = {
  SEA: "Container",
  AIR: "Air",
  LAND: "Land",
  COURIER: "Courier",
  MIXED: "Mixed",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "미완료",
  PARTIAL: "부분완료",
  PAID: "완료",
  OVERDUE: "연체",
};

const STEP_LABELS = ["신규 등록", "검토 (담당자 배정)", "신고 진행", "완료(필증 업로드)"];

const ATTACHMENTS = [
  { name: "말소 증명서", size: "81.93 KB" },
  { name: "인보이스/패킹리스트", size: "81.93 KB" },
  { name: "컨테이너/차량 사진", size: "81.93 KB" },
  { name: "쇼링 리스트", size: "81.93 KB" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "REGISTERED":
      return 0;
    case "IN_PROGRESS":
      return 1;
    case "CUSTOMS_DECLARED":
      return 2;
    case "CUSTOMS_ACCEPTED":
    case "ARRIVAL_CONFIRMED":
    case "COMPLETED":
      return 3;
    default:
      return 0;
  }
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function formatNumber(value?: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString();
}

function formatAmount(value?: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toLocaleString();
}

function getArrivalLabel(status: string): string {
  return status === "ARRIVAL_CONFIRMED" || status === "COMPLETED" ? "Yes" : "No";
}

function inferItemType(cargo: Cargo): string {
  const target = `${cargo.itemName ?? ""} ${cargo.originCountry ?? ""}`.toLowerCase();
  if (target.includes("tire") || target.includes("타이어")) return "Tires";
  if (
    target.includes("car") ||
    target.includes("차량") ||
    target.includes("hyundai") ||
    target.includes("kia")
  ) {
    return "Used Car";
  }
  return "Parts";
}

type SectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function Section({ title, action, children, className }: SectionProps) {
  return (
    <section
      className={`w-full rounded-[12px] bg-white px-[64px] py-[36px] shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)] ${
        className ?? ""
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[24px] font-semibold leading-[36px] tracking-[0.1px] text-Neutral-black">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type FieldProps = {
  label: string;
  value?: string | number;
  required?: boolean;
};

function ReadonlyField({ label, value, required = false }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-[13px] font-medium text-Neutral-600">
        {label}
        {required && <span className="ml-1 text-Red-500">*</span>}
      </label>
      <div className="h-[40px] rounded-[6px] border border-Neutral-400 bg-Neutral-100 px-3 text-[14px] leading-[40px] text-Neutral-800">
        {value === undefined || value === null || value === "" ? "-" : value}
      </div>
    </div>
  );
}

function CargoDescription({ cargo }: { cargo: Cargo }) {
  const itemType = inferItemType(cargo);
  const model = itemType === "Used Car" ? cargo.itemName : "-";
  return (
    <>
      <td className="px-2 py-2 text-center">{model}</td>
      <td className="px-2 py-2 text-center">-</td>
      <td className="px-2 py-2 text-center">-</td>
      <td className="px-2 py-2 text-center">-</td>
      <td className="px-2 py-2 text-center">-</td>
    </>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<BrokerCase | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/cases/${id}`).then((data: unknown) => setCaseData(data as BrokerCase));
  }, [id]);

  if (!caseData) {
    return (
      <Layout activeMenu={2}>
        <div className="flex w-full items-center justify-center px-[8px] pb-[154px] pt-[54px] text-Neutral-600">
          로딩 중...
        </div>
      </Layout>
    );
  }

  const stepIndex = getStepIndex(caseData.status);
  const cargoRows = caseData.cargos ?? [];
  const progressPercent = (stepIndex / (STEP_LABELS.length - 1)) * 82;
  const transport = SHIPPING_LABEL[caseData.shippingMethod] ?? "-";

  return (
    <Layout activeMenu={2}>
      <div className="flex w-full flex-col items-start gap-[10px] px-[8px] pb-[154px] pt-[54px]">
        <section className="w-full rounded-[12px] bg-white px-[24px] py-[14px] shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <button
            type="button"
            onClick={() => navigate("/cases")}
            className="inline-flex items-center gap-2 text-sm font-medium text-Neutral-600 hover:text-Blue-700"
          >
            <ArrowLeft size={16} />
            케이스 목록
          </button>
        </section>

        <section className="w-full rounded-[12px] bg-white px-[64px] py-[36px] shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h1 className="text-[40px] font-semibold leading-[36px] tracking-[0.1px] text-Neutral-900">
              {caseData.caseNumber} | {caseData.clientName} | {caseData.arrivalPort || "-"} | {transport} |{" "}
              {formatDate(caseData.etaDate)}
            </h1>
            <button
              type="button"
              className="h-[36px] rounded-[6px] bg-Neutral-black px-4 text-[16px] font-medium leading-[28px] tracking-[0.2px] text-white"
            >
              통관 프로그램 붙이기
            </button>
          </div>
        </section>

        <Section title="진행상황">
          <div className="relative pt-5">
            <div className="absolute left-[9%] right-[9%] top-[46px] h-[8px] rounded-full bg-Blue-100" />
            <div
              className="absolute left-[9%] top-[46px] h-[8px] rounded-full bg-Blue-600"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="grid grid-cols-4 gap-2">
              {STEP_LABELS.map((label, index) => {
                const isDone = index < stepIndex || (stepIndex === 0 && index === 0);
                const isCurrent = index === stepIndex && !(stepIndex === 0 && index === 0);
                return (
                  <div key={label} className="flex flex-col items-center gap-2 text-center">
                    <div
                      className={`flex h-[55px] w-[55px] items-center justify-center rounded-full border-4 ${
                        isDone
                          ? "border-Blue-700 bg-Blue-700 text-white"
                          : isCurrent
                            ? "border-Blue-700 bg-white text-Blue-700"
                            : "border-Neutral-500 bg-white text-Neutral-500"
                      }`}
                    >
                      {isDone ? <Check size={28} strokeWidth={3} /> : <div className="h-4 w-4 rounded-full" />}
                    </div>
                    <div className="text-[14px] font-semibold leading-[24px] tracking-[0.1px] text-Neutral-900">
                      {label}
                    </div>
                    <div className="text-[12px] leading-[20px] tracking-[0.2px] text-Neutral-600">
                      {index === 0 ? formatDate(caseData.createdAt) : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <div className="grid w-full grid-cols-1 gap-[10px] xl:grid-cols-[433px_minmax(0,1fr)]">
          <Section title="담당자" className="h-full px-[64px] py-[36px]">
            <div className="flex flex-col gap-6">
              <div className="rounded-[12px] border border-Neutral-400 bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[18px] font-semibold leading-[32px] tracking-[0.1px] text-Neutral-black">
                    반입 여부
                  </div>
                  <div className="text-[14px] font-medium leading-[24px] text-Neutral-600">상태 변경하기</div>
                </div>
                <div className="rounded-[8px] bg-Neutral-100 py-3 text-center text-[40px] font-bold leading-[48px] text-Blue-700">
                  {getArrivalLabel(caseData.status)}
                </div>
                <button
                  type="button"
                  className="mt-3 h-[48px] w-full rounded-[8px] bg-Blue-700 text-[16px] font-semibold leading-[28px] text-white"
                >
                  반입 체크하러 가기
                </button>
              </div>

              <div className="rounded-[12px] border border-Neutral-400 bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[18px] font-semibold leading-[32px] tracking-[0.1px] text-Neutral-black">
                    결제 상태
                  </div>
                  <div className="text-[14px] font-medium leading-[24px] text-Neutral-600">상태 변경하기</div>
                </div>
                <div className="rounded-[8px] bg-Neutral-100 py-3 text-center text-[40px] font-bold leading-[48px] text-Blue-700">
                  {PAYMENT_LABEL[caseData.paymentStatus]}
                </div>
              </div>
            </div>
          </Section>

          <Section title="첨부 파일" className="h-full px-[64px] py-[36px]">
            <div className="flex flex-col gap-4">
              {ATTACHMENTS.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between rounded-[10px] border border-Neutral-400 bg-white px-[18px] py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-Neutral-100 text-Neutral-600">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="text-[14px] leading-[24px] tracking-[0.2px] text-Neutral-800">{file.name}</div>
                      <div className="text-[12px] leading-[20px] tracking-[0.2px] text-Neutral-600">{file.size}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-Neutral-600">
                    <button type="button" className="rounded-md p-1 hover:bg-Neutral-100">
                      <Eye size={18} />
                    </button>
                    <button type="button" className="rounded-md p-1 hover:bg-Neutral-100">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="화물 리스트" className="border border-Neutral-400">
          <div className="overflow-x-auto rounded-[8px] border border-Neutral-300">
            <table className="min-w-[1240px] w-full text-[12px] text-Neutral-black">
              <thead>
                <tr className="bg-[#0E162B] text-white">
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    No.
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    Item Type
                  </th>
                  <th colSpan={5} className="px-2 py-3 text-center font-semibold">
                    Description
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    HS Code
                  </th>
                  <th colSpan={2} className="px-2 py-3 text-center font-semibold">
                    Weight(kg)
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    CBM(m³)
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    Unit Price($)
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    Qty
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center font-semibold">
                    Amount($)
                  </th>
                </tr>
                <tr className="bg-Neutral-300 text-Neutral-black">
                  <th className="px-2 py-2 text-center font-semibold">Model</th>
                  <th className="px-2 py-2 text-center font-semibold">Year</th>
                  <th className="px-2 py-2 text-center font-semibold">Chassis/VIN No.</th>
                  <th className="px-2 py-2 text-center font-semibold">Fuel Type</th>
                  <th className="px-2 py-2 text-center font-semibold">Engine CC</th>
                  <th className="px-2 py-2 text-center font-semibold">Net</th>
                  <th className="px-2 py-2 text-center font-semibold">Gross</th>
                </tr>
              </thead>
              <tbody>
                {cargoRows.map((cargo, index) => {
                  const amount = cargo.totalPrice ?? cargo.quantity * cargo.unitPrice;
                  const net = cargo.weight ?? 0;
                  const gross = net > 0 ? Number((net * 1.06).toFixed(2)) : 0;
                  const cbm = net > 0 ? Number((net / 4500).toFixed(2)) : 0;
                  return (
                    <tr key={cargo.id} className="border-b border-Neutral-300 bg-white">
                      <td className="px-2 py-2 text-center">{index + 1}</td>
                      <td className="px-2 py-2 text-center">{inferItemType(cargo)}</td>
                      <CargoDescription cargo={cargo} />
                      <td className="px-2 py-2 text-center">{cargo.hsCode || "-"}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(net)}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(gross)}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(cbm)}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(cargo.unitPrice)}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(cargo.quantity)}</td>
                      <td className="px-2 py-2 text-center">{formatAmount(amount)}</td>
                    </tr>
                  );
                })}
                {cargoRows.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-3 py-10 text-center text-Neutral-600">
                      등록된 화물이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="구매자 설정"
          action={
            <button
              type="button"
              className="inline-flex h-[36px] items-center gap-1 rounded-[8px] bg-Blue-700 px-4 text-[14px] font-medium text-white"
            >
              <Pencil size={14} />
              수정하기
            </button>
          }
          className="border border-Neutral-400"
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ReadonlyField label="구매자" value={caseData.clientName} required />
            <ReadonlyField label="구매자상호" value={caseData.clientName} required />
          </div>
        </Section>

        <Section
          title="통관 데이터"
          action={
            <button
              type="button"
              className="inline-flex h-[36px] items-center gap-1 rounded-[8px] bg-Blue-700 px-4 text-[14px] font-medium text-white"
            >
              <Pencil size={14} />
              수정하기
            </button>
          }
          className="border border-Neutral-400"
        >
          <div className="flex flex-col gap-5">
            <div className="rounded-[10px] border border-Neutral-400 p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ReadonlyField label="수출 예정지 코드" value={caseData.departurePorts} required />
                <ReadonlyField label="수출신고자" value="B" required />
                <ReadonlyField label="신고일" value={formatDate(caseData.customsDate)} required />
                <ReadonlyField label="통지서(납부번호)" value={caseData.blNumber} />
                <ReadonlyField label="사업자식별번호" value="0000" />
                <ReadonlyField label="화주코드" value={caseData.clientId} />
              </div>
            </div>

            <div className="rounded-[10px] border border-Neutral-400 p-4">
              <div className="mb-3 text-[14px] font-semibold text-Neutral-800">수출자</div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <ReadonlyField label="코드" value={caseData.clientId} required />
                <ReadonlyField label="대표자" value={caseData.clientName} required />
                <ReadonlyField label="상호" value={caseData.clientName} required />
                <ReadonlyField label="통관고유부호" value="-" required />
                <ReadonlyField label="주소" value={caseData.departurePorts} required />
                <ReadonlyField label="사업자번호" value="-" required />
                <ReadonlyField label="화주구분" value="C" required />
                <ReadonlyField label="우편번호" value="-" required />
              </div>
            </div>

            <div className="rounded-[10px] border border-Neutral-400 p-4">
              <div className="mb-3 text-[14px] font-semibold text-Neutral-800">세관 정보</div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <ReadonlyField label="결제통화" value="USD" required />
                <ReadonlyField label="신고구분" value={STATUS_LABEL[caseData.status]} required />
                <ReadonlyField label="거래 구분" value="11" required />
                <ReadonlyField label="품목구분" value="A" required />
                <ReadonlyField label="목적국" value={caseData.arrivalPort} required />
                <ReadonlyField label="적재항" value={caseData.departurePorts} required />
                <ReadonlyField label="운송수단" value={transport} required />
                <ReadonlyField label="운송형기" value={getArrivalLabel(caseData.status)} />
              </div>
            </div>

            <div className="rounded-[10px] border border-Neutral-400 p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ReadonlyField label="반출일정일" value={formatDate(caseData.releaseDate)} required />
                <ReadonlyField label="반입번호" value={caseData.blNumber} required />
                <ReadonlyField label="신고일자" value={formatDate(caseData.customsDate)} required />
                <ReadonlyField label="반출시작일시" value={formatDate(caseData.releaseDate)} />
                <ReadonlyField label="반출시작지역 주소" value={caseData.arrivalPort} />
                <ReadonlyField label="장치장코드" value="-" />
              </div>
            </div>

            <div className="rounded-[10px] border border-Neutral-400 p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ReadonlyField label="총기재금액" value={formatNumber(caseData.totalAmount)} />
                <ReadonlyField label="필제금액" value={formatNumber(caseData.totalAmount)} />
                <ReadonlyField label="총포장갯수" value={cargoRows.length} />
                <ReadonlyField
                  label="총중량"
                  value={formatNumber(cargoRows.reduce((sum, row) => sum + (row.weight || 0), 0))}
                />
                <ReadonlyField label="노선료(USD)" value="0.00" />
                <ReadonlyField label="기타금액(USD)" value="0.00" />
                <ReadonlyField label="통지신고일" value={formatDate(caseData.customsDate)} />
                <ReadonlyField label="수리일자" value={formatDate(caseData.customsDate)} />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
