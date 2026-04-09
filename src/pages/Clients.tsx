import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import { api } from "../lib/api/client";
import type { Client, CreateClientRequest } from "../lib/api/types";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2 } from "lucide-react";

const PAGE_SIZE = 10;
const SYNC_ENDPOINTS = ["/api/clients/sync", "/api/clients/synchronize", "/api/ncustoms/clients/sync"];

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function isSynced(client: Client): boolean {
  const record = client as unknown as Record<string, unknown>;

  if (typeof record.synced === "boolean") return record.synced;
  if (typeof record.isSynced === "boolean") return record.isSynced;

  const syncStatus = pickString(record, ["syncStatus", "sync", "status"]);
  if (syncStatus) {
    const upper = syncStatus.toUpperCase();
    if (upper.includes("UNSYNC") || upper.includes("FAIL") || upper.includes("비동기")) return false;
    if (upper.includes("SYNC") || upper.includes("SUCCESS") || upper.includes("동기")) return true;
  }

  return client.active;
}

function clientCode(client: Client): string {
  const record = client as unknown as Record<string, unknown>;
  return (
    pickString(record, ["code", "clientCode", "dealCode", "shipperCode"]) ??
    `CL${String(client.id).padStart(4, "0")}`
  );
}

function customsUniqueCode(client: Client): string {
  const record = client as unknown as Record<string, unknown>;
  return (
    pickString(record, ["customsUniqueCode", "customsCode", "dealTong", "whajuTong"]) ??
    client.businessNumber ??
    "-"
  );
}

function identifierCode(client: Client): string {
  const record = client as unknown as Record<string, unknown>;
  return (
    pickString(record, ["identifierCode", "identificationCode", "dealSaup", "dealSaupgbn"]) ??
    client.businessNumber ??
    "-"
  );
}

function locationAddress(client: Client): string {
  const record = client as unknown as Record<string, unknown>;
  return pickString(record, ["address", "dealJuso", "locationAddress"]) ?? "-";
}

function visiblePages(currentPage: number, totalPages: number): number[] {
  const maxButtons = 5;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newClientCode, setNewClientCode] = useState("");
  const [newIdentifierCode, setNewIdentifierCode] = useState("");
  const [newClient, setNewClient] = useState<CreateClientRequest>({
    companyName: "",
    representativeName: "",
    businessNumber: "",
    phoneNumber: "",
    email: "",
    address: "",
    memo: "",
  });

  const fetchClients = async () => {
    const data = (await api.get("/api/clients")) as unknown as Client[];
    setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paged = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = visiblePages(page, totalPages);

  const handleOpenCreateForm = () => {
    setNewClientCode("");
    setNewIdentifierCode("");
    setNewClient({
      companyName: "",
      representativeName: "",
      businessNumber: "",
      phoneNumber: "",
      email: "",
      address: "",
      memo: "",
    });
    setShowCreateForm(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const payload: CreateClientRequest = {
      companyName: newClient.companyName.trim(),
      representativeName: newClient.representativeName.trim(),
      businessNumber: newClient.businessNumber.trim(),
      phoneNumber: newClient.phoneNumber.trim(),
      email: newClient.email.trim(),
      address: newClient.address.trim(),
      memo: [newClientCode.trim(), newIdentifierCode.trim()].filter(Boolean).join(" / "),
    };

    if (!payload.companyName || !payload.representativeName || !payload.businessNumber) {
      alert("상호, 대표자, 통관고유부호는 필수입니다.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/clients", payload);
      await fetchClients();
      setShowCreateForm(false);
      setPage(1);
    } catch (err) {
      console.error(err);
      alert("화주 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncClients = async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      let synced = false;
      for (const endpoint of SYNC_ENDPOINTS) {
        try {
          await api.post(endpoint);
          synced = true;
          break;
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 404 || status === 405) continue;
          throw error;
        }
      }

      await fetchClients();
      if (!synced) {
        alert("동기화 API가 연결되지 않아 목록만 새로고침했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("동기화 중 오류가 발생했습니다.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (deletingId) return;

    const ok = window.confirm(`'${client.companyName}' 화주를 삭제할까요?`);
    if (!ok) return;

    setDeletingId(client.id);
    try {
      await api.delete(`/api/clients/${client.id}`);
      await fetchClients();
      if (page > 1 && clients.length - 1 <= (page - 1) * PAGE_SIZE) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error(error);
      alert("화주 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout activeMenu={4}>
      <div className="px-[62px] pt-[54px] pb-[154px]">
        <section className="w-full rounded-[12px] bg-white px-[64px] py-[36px] shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-1 items-center gap-6">
              <h1
                className="whitespace-nowrap text-[24px] font-semibold tracking-[0.1px] text-Neutral-900"
                style={{ fontFamily: "Pretendard" }}
              >
                화주 목록
              </h1>
              <div className="flex items-center gap-4 text-[14px] text-Neutral-600">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-full bg-Green-500" />
                  동기화
                </div>
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-full bg-Red-500" />
                  비동기화
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <button
                onClick={handleSyncClients}
                disabled={syncing}
                className="inline-flex h-[36px] items-center gap-1 rounded-[6px] bg-Neutral-900 px-4 text-[16px] font-medium tracking-[0.2px] text-white hover:opacity-90 disabled:bg-Neutral-500"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                통관 프로그램 동기화
              </button>

              <button
                onClick={handleOpenCreateForm}
                className="inline-flex h-[36px] items-center gap-1 rounded-[6px] bg-Blue-700 px-4 text-[16px] font-medium tracking-[0.2px] text-white hover:opacity-90"
              >
                <Plus size={18} />
                추가
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[8px]">
            <table className="w-full min-w-[1190px] text-[14px]">
              <thead>
                <tr className="h-[49px] bg-[#0E162B] text-white">
                  <th className="w-[60px] rounded-tl-[8px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">
                    상태
                  </th>
                  <th className="w-[110px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">코드</th>
                  <th className="w-[180px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">상호</th>
                  <th className="w-[122px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">대표자</th>
                  <th className="w-[186px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">
                    통관고유부호
                  </th>
                  <th className="w-[154px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">식별부호</th>
                  <th className="w-[280px] px-4 text-left text-[16px] font-semibold tracking-[0.1px]">소재지주소</th>
                  <th className="w-[111px] rounded-tr-[8px] px-4 text-center" />
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id} className="h-[60px] border-b border-Neutral-300 bg-white">
                    <td className="px-4">
                      <span
                        className={`inline-block size-3.5 rounded-full ${
                          isSynced(c) ? "bg-Green-500" : "bg-Red-500"
                        }`}
                        title={isSynced(c) ? "동기화" : "비동기화"}
                      />
                    </td>
                    <td className="px-4 text-[#1E1E1E]">{clientCode(c)}</td>
                    <td className="px-4 text-[#1E1E1E]">{c.companyName}</td>
                    <td className="px-4 text-[#1E1E1E]">{c.representativeName}</td>
                    <td className="px-4 text-[#1E1E1E]">{customsUniqueCode(c)}</td>
                    <td className="px-4 text-[#1E1E1E]">{identifierCode(c)}</td>
                    <td className="px-4 text-[#1E1E1E]">{locationAddress(c)}</td>
                    <td className="px-4 text-center">
                      <button
                        onClick={() => handleDeleteClient(c)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center justify-center text-Red-500 hover:text-Red-600 disabled:text-Neutral-300"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {paged.length === 0 && (
                  <tr className="h-[60px] border-b border-Neutral-300 bg-white">
                    <td colSpan={8} className="px-4 text-center text-Neutral-500">
                      등록된 화주가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-end justify-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="inline-flex size-8 items-center justify-center rounded-[6px] text-Neutral-900 disabled:text-Neutral-300"
            >
              <ChevronLeft size={18} />
            </button>

            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`inline-flex size-8 items-center justify-center rounded-[6px] text-[14px] tracking-[0.2px] ${
                  p === page ? "border border-Brand-2 text-Brand-2" : "text-Neutral-900 hover:bg-Neutral-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="inline-flex size-8 items-center justify-center rounded-[6px] text-Neutral-900 disabled:text-Neutral-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>

      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="w-full max-w-[760px] rounded-xl border border-Neutral-300 bg-white shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-Neutral-200 px-6 py-4">
              <h2 className="text-[20px] font-semibold text-Neutral-900">화주 정보 추가</h2>
            </div>
            <form onSubmit={handleCreateClient} className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-Neutral-700">코드</span>
                <input
                  value={newClientCode}
                  onChange={(e) => setNewClientCode(e.target.value)}
                  placeholder="예: 1LW7"
                  className="h-11 rounded-md border border-Neutral-300 px-3"
                />
              </label>

              <input
                value={newClient.companyName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="상호*"
                className="h-11 rounded-md border border-Neutral-300 px-3"
              />
              <input
                value={newClient.representativeName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, representativeName: e.target.value }))}
                placeholder="대표자*"
                className="h-11 rounded-md border border-Neutral-300 px-3"
              />
              <input
                value={newClient.businessNumber}
                onChange={(e) => setNewClient((prev) => ({ ...prev, businessNumber: e.target.value }))}
                placeholder="통관고유부호*"
                className="h-11 rounded-md border border-Neutral-300 px-3"
              />
              <input
                value={newIdentifierCode}
                onChange={(e) => setNewIdentifierCode(e.target.value)}
                placeholder="식별부호"
                className="h-11 rounded-md border border-Neutral-300 px-3"
              />
              <input
                value={newClient.address}
                onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="소재지주소"
                className="h-11 rounded-md border border-Neutral-300 px-3"
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="h-10 rounded-md border border-Neutral-300 px-4 text-sm text-Neutral-700 hover:bg-Neutral-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-md bg-Brand-2 px-4 text-sm text-white hover:opacity-90 disabled:bg-Neutral-400"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
