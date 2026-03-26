import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Circle, Download, Eye, Pencil } from "lucide-react";
import Layout from "../component/layout/Layout";
import { api } from "../lib/api/client";
import type { BrokerCase } from "../lib/api/types";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "신규 등록",
  IN_PROGRESS: "검토",
  CUSTOMS_DECLARED: "신고 진행",
  CUSTOMS_ACCEPTED: "완료",
  ARRIVAL_CONFIRMED: "완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const STEP_LABELS = ["신규 등록", "검토 (담당자 배정)", "신고 진행", "완료(통관 수리도)"];

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
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
}

function yesNo(status: string): "Yes" | "No" {
  return status === "ARRIVAL_CONFIRMED" || status === "COMPLETED" ? "Yes" : "No";
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
      className={`w-full rounded-xl bg-white px-8 py-7 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)] ${
        className ?? ""
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[28px] font-semibold text-[#191B1F]">{title}</h2>
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
      <label className="text-[13px] font-medium text-[#4A5563]">
        {label}
        {required && <span className="ml-1 text-[#E74C3C]">*</span>}
      </label>
      <div className="h-[40px] rounded-md border border-[#DDE3EA] bg-[#FAFCFE] px-3 text-[14px] leading-[40px] text-[#222A35]">
        {value === undefined || value === null || value === "" ? "-" : value}
      </div>
    </div>
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

  const attachments = useMemo(
    () => [
      { name: "운송 송장서", size: "81.93 KB" },
      { name: "선박/수탁관리서류 C", size: "81.93 KB" },
      { name: "벤더-송장본 서신", size: "81.93 KB" },
      { name: "스캔 리스본", size: "81.93 KB" },
    ],
    [],
  );

  if (!caseData) {
    return (
      <Layout activeMenu={2}>
        <div className="flex w-full items-center justify-center px-[8px] pb-[154px] pt-[54px] text-[#667085]">
          로딩 중...
        </div>
      </Layout>
    );
  }

  const stepIndex = getStepIndex(caseData.status);
  const cargoRows = caseData.cargos ?? [];

  return (
    <Layout activeMenu={2}>
      <div className="flex w-full flex-col items-start gap-[10px] px-[8px] pb-[154px] pt-[54px]">
        <section className="w-full rounded-lg bg-white px-5 py-3 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <button
            type="button"
            onClick={() => navigate("/cases")}
            className="inline-flex items-center gap-2 text-sm text-[#4A5563] hover:text-[#1F4ED8]"
          >
            <ArrowLeft size={15} />
            케이스 목록
          </button>
        </section>

        <section className="w-full rounded-lg bg-white px-7 py-5 shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h1 className="text-[34px] font-medium text-[#13161B]">
              {caseData.caseNumber} | {caseData.clientName} | {caseData.arrivalPort || "-"} |{" "}
              {formatDate(caseData.createdAt)}
            </h1>
            <button
              type="button"
              className="h-[36px] rounded-md bg-black px-4 text-sm font-medium text-white"
            >
              신고 필드보기 열기
            </button>
          </div>
        </section>

        <Section title="진행상황">
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center">
              {STEP_LABELS.map((label, index) => {
                const done = index <= stepIndex;
                const active = index === stepIndex;
                return (
                  <div key={label} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          done
                            ? "border-[#2451D5] bg-[#2451D5] text-white"
                            : "border-[#B9C0C9] bg-white text-[#B9C0C9]"
                        }`}
                      >
                        {done ? <Check size={18} /> : <Circle size={18} />}
                      </div>
                      <span className={`text-xs ${active ? "text-[#111827]" : "text-[#5B6472]"}`}>
                        {label}
                      </span>
                    </div>
                    {index < STEP_LABELS.length - 1 && (
                      <div
                        className={`mx-4 h-[3px] flex-1 ${
                          index < stepIndex ? "bg-[#2451D5]" : "bg-[#D5DCE5]"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-[#7A8393]">{formatDate(caseData.createdAt)}</div>
          </div>
        </Section>

        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Section title="담당자" className="h-full">
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-[#E3E8EF] p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-[#5B6472]">
                  <span>반입 여부</span>
                  <span>상태 변경하기</span>
                </div>
                <div className="rounded-md bg-[#F7F9FC] py-3 text-center text-[34px] font-bold text-[#2451D5]">
                  {yesNo(caseData.status)}
                </div>
                <button
                  type="button"
                  className="mt-3 h-[38px] w-full rounded-md bg-[#2451D5] text-sm font-medium text-white"
                >
                  반입 체크하러 가기
                </button>
              </div>

              <div className="rounded-lg border border-[#E3E8EF] p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-[#5B6472]">
                  <span>결제 상태</span>
                  <span>상태 변경하기</span>
                </div>
                <div className="rounded-md bg-[#F7F9FC] py-3 text-center text-[34px] font-bold text-[#2451D5]">
                  {caseData.paymentStatus === "PAID" ? "완료" : "미완료"}
                </div>
              </div>
            </div>
          </Section>

          <Section title="첨부 파일" className="h-full">
            <div className="flex flex-col gap-3">
              {attachments.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between rounded-lg border border-[#E1E7EE] px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-[#1F2937]">{file.name}</div>
                    <div className="text-xs text-[#7A8393]">{file.size}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4B5563] hover:bg-[#F3F4F6]"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4B5563] hover:bg-[#F3F4F6]"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="화물 리스트">
          <div className="overflow-x-auto rounded-lg border border-[#DEE4EB]">
            <table className="min-w-[1180px] w-full text-[13px]">
              <thead>
                <tr className="bg-[#061334] text-white">
                  <th className="px-3 py-3 text-left font-medium">No.</th>
                  <th className="px-3 py-3 text-left font-medium">Item Type</th>
                  <th className="px-3 py-3 text-left font-medium">Description</th>
                  <th className="px-3 py-3 text-left font-medium">HS Code</th>
                  <th className="px-3 py-3 text-right font-medium">Weight(kg)</th>
                  <th className="px-3 py-3 text-right font-medium">CBM(m³)</th>
                  <th className="px-3 py-3 text-right font-medium">Unit Price($)</th>
                  <th className="px-3 py-3 text-right font-medium">Qty</th>
                  <th className="px-3 py-3 text-right font-medium">Amount($)</th>
                </tr>
              </thead>
              <tbody>
                {cargoRows.map((cargo, index) => {
                  const amount = cargo.totalPrice ?? cargo.quantity * cargo.unitPrice;
                  return (
                    <tr key={cargo.id} className="border-b border-[#E8ECF2] text-[#202632]">
                      <td className="px-3 py-3">{index + 1}</td>
                      <td className="px-3 py-3">{cargo.itemName}</td>
                      <td className="px-3 py-3">{cargo.itemName}</td>
                      <td className="px-3 py-3">{cargo.hsCode}</td>
                      <td className="px-3 py-3 text-right">{formatNumber(cargo.weight)}</td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className="px-3 py-3 text-right">{formatNumber(cargo.unitPrice)}</td>
                      <td className="px-3 py-3 text-right">{formatNumber(cargo.quantity)}</td>
                      <td className="px-3 py-3 text-right">{formatNumber(amount)}</td>
                    </tr>
                  );
                })}
                {cargoRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-[#667085]">
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
              className="inline-flex h-[32px] items-center gap-1 rounded-md bg-[#2451D5] px-3 text-sm text-white"
            >
              <Pencil size={14} />
              수정하기
            </button>
          }
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
              className="inline-flex h-[32px] items-center gap-1 rounded-md bg-[#2451D5] px-3 text-sm text-white"
            >
              <Pencil size={14} />
              수정하기
            </button>
          }
        >
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-[#E1E7EE] p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ReadonlyField label="수출 예정지 코드" value={caseData.departurePorts} required />
                <ReadonlyField label="수출신고자" value="B" required />
                <ReadonlyField label="신고일" value={formatDate(caseData.customsDate)} required />
                <ReadonlyField label="통지서(납부번호)" value={caseData.blNumber} />
                <ReadonlyField label="사업자식별번호" value="0000" />
                <ReadonlyField label="화주코드" value={caseData.clientId} />
              </div>
            </div>

            <div className="rounded-lg border border-[#E1E7EE] p-4">
              <div className="mb-3 text-[14px] font-semibold text-[#273142]">수출자</div>
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

            <div className="rounded-lg border border-[#E1E7EE] p-4">
              <div className="mb-3 text-[14px] font-semibold text-[#273142]">세관 정보</div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <ReadonlyField label="결제통화" value="USD" required />
                <ReadonlyField label="신고구분" value={STATUS_LABEL[caseData.status]} required />
                <ReadonlyField label="거래 구분" value="11" required />
                <ReadonlyField label="품목구분" value="A" required />
                <ReadonlyField label="목적국" value={caseData.arrivalPort} required />
                <ReadonlyField label="적재항" value={caseData.departurePorts} required />
                <ReadonlyField label="운송수단" value={caseData.shippingMethod} required />
                <ReadonlyField label="운송형기" value={yesNo(caseData.status)} />
              </div>
            </div>

            <div className="rounded-lg border border-[#E1E7EE] p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ReadonlyField label="반출일정일" value={formatDate(caseData.releaseDate)} required />
                <ReadonlyField label="반입번호" value={caseData.blNumber} required />
                <ReadonlyField label="신고일자" value={formatDate(caseData.customsDate)} required />
                <ReadonlyField label="반출시작일시" value={formatDate(caseData.releaseDate)} />
                <ReadonlyField label="반출시작지역 주소" value={caseData.arrivalPort} />
                <ReadonlyField label="장치장코드" value="-" />
              </div>
            </div>

            <div className="rounded-lg border border-[#E1E7EE] p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ReadonlyField label="총기재금액" value={formatNumber(caseData.totalAmount)} />
                <ReadonlyField label="필제금액" value={formatNumber(caseData.totalAmount)} />
                <ReadonlyField label="총포장갯수" value={cargoRows.length} />
                <ReadonlyField label="총중량" value={formatNumber(cargoRows.reduce((sum, row) => sum + (row.weight || 0), 0))} />
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
