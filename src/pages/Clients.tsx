import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import TablePager from "../component/TablePager";
import SearchInput from "../component/inputs/SearchInput";
import { api } from "../lib/api/client";
import type { Client, CreateClientRequest } from "../lib/api/types";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const filtered = clients.filter((c) => {
    if (!search) return true;
    return (
      c.companyName.includes(search) ||
      c.businessNumber.includes(search) ||
      c.representativeName.includes(search)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleActive = async (clientId: number) => {
    try {
      await api.patch(`/api/clients/${clientId}/toggle-active`);
      await fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <Layout activeMenu={4}>
      <div className="pt-9 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1
            className="text-[24px] font-bold text-Neutral-900"
            style={{ fontFamily: "Pretendard" }}
          >
            화주 관리
          </h1>
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-Brand-2 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            추가
          </button>
        </div>

        {showCreateForm && (
          <div className="p-4 rounded-lg border border-Neutral-300 bg-white">
            <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={newClient.companyName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder="회사명*"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.representativeName}
                onChange={(e) => setNewClient((prev) => ({ ...prev, representativeName: e.target.value }))}
                placeholder="대표자*"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.businessNumber}
                onChange={(e) => setNewClient((prev) => ({ ...prev, businessNumber: e.target.value }))}
                placeholder="사업자번호*"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.phoneNumber}
                onChange={(e) => setNewClient((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="연락처"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.email}
                onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="이메일"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.address}
                onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="주소"
                className="h-10 px-3 border border-Neutral-300 rounded-md"
              />
              <input
                value={newClient.memo ?? ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="메모"
                className="h-10 px-3 border border-Neutral-300 rounded-md md:col-span-2"
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
        )}

        <TableLayout>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="w-[280px]">
                <SearchInput
                  placeholder="회사명 / 사업자번호 / 대표자 검색"
                  value={search}
                  onChange={setSearch}
                />
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-Neutral-900 text-white">
                  <th className="px-4 py-3 text-center font-medium rounded-tl-lg w-[60px]">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left font-medium">회사명</th>
                  <th className="px-4 py-3 text-left font-medium">대표자</th>
                  <th className="px-4 py-3 text-left font-medium">사업자번호</th>
                  <th className="px-4 py-3 text-left font-medium">연락처</th>
                  <th className="px-4 py-3 text-left font-medium">이메일</th>
                  <th className="px-4 py-3 text-left font-medium rounded-tr-lg">주소</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-Neutral-200 hover:bg-Neutral-100 transition-colors"
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(c.id)}
                        className="inline-flex items-center justify-center"
                        title={c.active ? "활성" : "비활성"}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            c.active ? "bg-Green-500" : "bg-Red-500"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-Neutral-900">{c.companyName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.representativeName}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.businessNumber}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.phoneNumber}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.email}</td>
                    <td className="px-4 py-3 text-Neutral-700">{c.address}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-Neutral-500">
                      등록된 화주가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <TablePager currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </TableLayout>
      </div>
    </Layout>
  );
}
