import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import TablePager from "../component/TablePager";
import { api } from "../lib/api/client";
import type { Client, CreateClientRequest } from "../lib/api/types";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

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

  if (typeof record.synced === "boolean") {
    return record.synced;
  }
  if (typeof record.isSynced === "boolean") {
    return record.isSynced;
  }

  const syncStatus = pickString(record, ["syncStatus", "sync", "status"]);
  if (syncStatus) {
    const upper = syncStatus.toUpperCase();
    if (upper.includes("UNSYNC") || upper.includes("FAIL") || upper.includes("비동기")) {
      return false;
    }
    if (upper.includes("SYNC") || upper.includes("SUCCESS") || upper.includes("동기")) {
      return true;
    }
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

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const handleOpenCreateForm = () => {
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
      memo: newClient.memo?.trim(),
    };

    if (!payload.companyName || !payload.representativeName || !payload.businessNumber) {
      alert("회사명, 대표자, 사업자번호는 필수입니다.");
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
          if (status === 404 || status === 405) {
            continue;
          }
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
      if (page > 1 && (clients.length - 1) <= (page - 1) * PAGE_SIZE) {
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
      <div className="pt-9 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h1
              className="text-[24px] font-bold text-Neutral-900"
              style={{ fontFamily: "Pretendard" }}
            >
              화주 목록
            </h1>
            <div className="flex items-center gap-4 text-sm text-Neutral-600">
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncClients}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-Neutral-900 text-white rounded-md font-medium text-sm hover:opacity-90 disabled:bg-Neutral-500 transition-opacity"
            >
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              통관 프로그램 동기화
            </button>
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-Brand-2 text-white rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              추가
            </button>
          </div>
        </div>

        <TableLayout>
          <div className="flex flex-col gap-4">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-Neutral-900 text-white">
                  <th className="px-4 py-3 text-center font-medium rounded-tl-lg w-[60px]">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left font-medium w-[110px]">코드</th>
                  <th className="px-4 py-3 text-left font-medium">상호</th>
                  <th className="px-4 py-3 text-left font-medium">대표자</th>
                  <th className="px-4 py-3 text-left font-medium">통관고유부호</th>
                  <th className="px-4 py-3 text-left font-medium">식별부호</th>
                  <th className="px-4 py-3 text-left font-medium">소재지주소</th>
                  <th className="px-4 py-3 text-center font-medium rounded-tr-lg w-[72px]" />
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-Neutral-200 hover:bg-Neutral-100 transition-colors"
                  >
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          isSynced(c) ? "bg-Green-500" : "bg-Red-500"
                        }`}
                        title={isSynced(c) ? "동기화" : "비동기화"}
                      />
                    </td>
                    <td className="px-4 py-3 text-Neutral-700">{clientCode(c)}</td>
                    <td className="px-4 py-3 font-medium text-Neutral-900">{c.companyName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.representativeName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{customsUniqueCode(c)}</td>
                    <td className="px-4 py-3 text-Neutral-700">{identifierCode(c)}</td>
                    <td className="px-4 py-3 text-Neutral-700">{locationAddress(c)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteClient(c)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center justify-center text-Red-500 hover:text-Red-600 disabled:text-Neutral-300"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-Neutral-500">
                      등록된 화주가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>

            <TablePager currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </TableLayout>
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
              <h2 className="text-[20px] font-semibold text-Neutral-900">화주 추가</h2>
            </div>
            <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6">
              <input
                value={newClient.companyName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="회사명*"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.representativeName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, representativeName: e.target.value }))}
                placeholder="대표자*"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.businessNumber}
                onChange={(e) => setNewClient((prev) => ({ ...prev, businessNumber: e.target.value }))}
                placeholder="사업자번호*"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.phoneNumber}
                onChange={(e) => setNewClient((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="연락처"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.email}
                onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="이메일"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.address}
                onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="주소"
                className="h-11 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.memo ?? ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="메모"
                className="h-11 px-3 border border-Neutral-300 rounded-md md:col-span-2"
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="h-10 px-4 border border-Neutral-300 rounded-md text-sm text-Neutral-700 hover:bg-Neutral-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-4 bg-Brand-2 text-white rounded-md text-sm hover:opacity-90 disabled:bg-Neutral-400"
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
