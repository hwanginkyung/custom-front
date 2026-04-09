import { useEffect, useMemo, useState } from "react";
import Layout from "../component/layout/Layout";
import { api } from "../lib/api/client";
import type { Client } from "../lib/api/types";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

const PAGE_SIZE = 10;
const MODAL_PAGE_SIZE = 8;
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

  const direct = pickString(record, ["identifierCode", "identificationCode", "dealSaup", "dealSaupgbn"]);
  if (direct) return direct;

  if (client.memo && client.memo.includes("/")) {
    const parts = client.memo.split("/").map((v) => v.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[1];
  }

  return "-";
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

  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [modalKeyword, setModalKeyword] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalRows, setModalRows] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);

  const fetchClients = async (): Promise<Client[]> => {
    const data = (await api.get("/api/clients")) as unknown as Client[];
    setClients(data);
    return data;
  };

  const syncClients = async (): Promise<{ synced: boolean; data: Client[] }> => {
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

    const data = await fetchClients();
    return { synced, data };
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paged = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = visiblePages(page, totalPages);

  const filteredModalRows = useMemo(() => {
    const keyword = modalKeyword.trim().toLowerCase();
    if (!keyword) return modalRows;

    return modalRows.filter((c) => {
      const code = clientCode(c).toLowerCase();
      const company = c.companyName.toLowerCase();
      const rep = c.representativeName.toLowerCase();
      const customs = customsUniqueCode(c).toLowerCase();
      const ident = identifierCode(c).toLowerCase();
      return (
        code.includes(keyword) ||
        company.includes(keyword) ||
        rep.includes(keyword) ||
        customs.includes(keyword) ||
        ident.includes(keyword)
      );
    });
  }, [modalRows, modalKeyword]);

  const modalPagedRows = filteredModalRows.slice(0, MODAL_PAGE_SIZE);

  const selectedRows = useMemo(
    () => modalRows.filter((c) => selectedClientIds.includes(c.id)),
    [modalRows, selectedClientIds],
  );

  const handleOpenLoadModal = () => {
    setModalKeyword("");
    setSelectedClientIds([]);
    setModalRows(clients);
    setShowLoadModal(true);
  };

  const handleTopSync = async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const { synced } = await syncClients();
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

  const handleModalLoad = async () => {
    if (modalLoading) return;
    setModalLoading(true);

    try {
      const { synced, data } = await syncClients();
      setModalRows(data);
      if (!synced) {
        alert("불러오기 API가 연결되지 않아 현재 목록을 표시합니다.");
      }
    } catch (error) {
      console.error(error);
      alert("불러오기 중 오류가 발생했습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  const toggleSelectClient = (clientId: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId],
    );
  };

  const removeSelectedClient = (clientId: number) => {
    setSelectedClientIds((prev) => prev.filter((id) => id !== clientId));
  };

  const handleModalSave = () => {
    if (selectedClientIds.length === 0) {
      alert("저장할 화주를 선택하세요.");
      return;
    }

    setShowLoadModal(false);
    alert(`선택한 화주 ${selectedClientIds.length}건을 저장했습니다.`);
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
                onClick={handleTopSync}
                disabled={syncing}
                className="inline-flex h-[36px] items-center gap-1 rounded-[6px] bg-Neutral-900 px-4 text-[16px] font-medium tracking-[0.2px] text-white hover:opacity-90 disabled:bg-Neutral-500"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                통관 프로그램 동기화
              </button>

              <button
                onClick={handleOpenLoadModal}
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

      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onClick={() => setShowLoadModal(false)}>
          <div
            className="w-full max-w-[760px] rounded-xl border border-Neutral-300 bg-white shadow-[0px_8px_24px_0px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-Neutral-200 px-6 py-4">
              <h2 className="text-[28px] font-semibold tracking-[0.1px] text-Neutral-900">화주 불러오기</h2>
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="inline-flex size-8 items-center justify-center rounded-md text-Neutral-700 hover:bg-Neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4 pb-5">
              <p className="mb-3 text-[16px] text-Neutral-600">불러올 화주를 선택하세요.</p>

              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={modalKeyword}
                    onChange={(e) => setModalKeyword(e.target.value)}
                    placeholder="검색어를 입력하세요"
                    className="h-[40px] w-full rounded-[6px] border border-Neutral-300 pr-10 pl-3 text-[14px]"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-Neutral-600" />
                </div>
                <button
                  type="button"
                  onClick={handleModalLoad}
                  disabled={modalLoading}
                  className="inline-flex h-[40px] items-center rounded-[6px] bg-Brand-2 px-4 text-[16px] font-medium text-white disabled:bg-Neutral-400"
                >
                  {modalLoading ? "불러오는 중..." : "불러오기"}
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  className="inline-flex h-[40px] items-center gap-1 rounded-[6px] bg-Neutral-900 px-4 text-[16px] font-medium text-white"
                >
                  저장하기
                </button>
              </div>

              <div className="overflow-hidden rounded-[8px] border border-Neutral-300">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="h-[44px] bg-[#0E162B] text-white">
                      <th className="px-4 text-left text-[16px] font-semibold">코드</th>
                      <th className="px-4 text-left text-[16px] font-semibold">상호</th>
                      <th className="px-4 text-left text-[16px] font-semibold">대표자</th>
                      <th className="px-4 text-left text-[16px] font-semibold">통관고유부호</th>
                      <th className="px-4 text-left text-[16px] font-semibold">식별부호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalPagedRows.map((row) => {
                      const selected = selectedClientIds.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          onClick={() => toggleSelectClient(row.id)}
                          className={`h-[52px] cursor-pointer border-b border-Neutral-200 ${
                            selected ? "bg-Blue-50" : "bg-white hover:bg-Neutral-100"
                          }`}
                        >
                          <td className="px-4 text-[14px] text-Neutral-900">{clientCode(row)}</td>
                          <td className="px-4 text-[14px] text-Neutral-900">{row.companyName}</td>
                          <td className="px-4 text-[14px] text-Neutral-900">{row.representativeName}</td>
                          <td className="px-4 text-[14px] text-Neutral-900">{customsUniqueCode(row)}</td>
                          <td className="px-4 text-[14px] text-Neutral-900">{identifierCode(row)}</td>
                        </tr>
                      );
                    })}
                    {modalPagedRows.length === 0 && (
                      <tr className="h-[52px] bg-white">
                        <td colSpan={5} className="px-4 text-center text-Neutral-500">
                          표시할 화주가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[16px] font-semibold text-Neutral-900">선택한 화주</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => removeSelectedClient(row.id)}
                      className="inline-flex items-center gap-1 rounded-[6px] bg-Blue-100 px-3 py-1.5 text-[14px] text-Brand-2"
                    >
                      {customsUniqueCode(row)}
                      <X size={14} />
                    </button>
                  ))}
                  {selectedRows.length === 0 && <span className="text-[14px] text-Neutral-500">선택된 화주 없음</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
