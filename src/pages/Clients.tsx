import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import TablePager from "../component/TablePager";
import SearchInput from "../component/inputs/SearchInput";
import { api } from "../lib/api/client";
import type { Client } from "../lib/api/types";
import { Plus } from "lucide-react";

const PAGE_SIZE = 10;

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/clients").then((data: unknown) => setClients(data as Client[]));
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
      const updated = (await api.get("/api/clients")) as unknown as Client[];
      setClients(updated);
    } catch (err) {
      console.error(err);
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
          <button className="flex items-center gap-1.5 px-4 py-2 bg-Brand-2 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            <Plus size={18} />
            추가
          </button>
        </div>

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
