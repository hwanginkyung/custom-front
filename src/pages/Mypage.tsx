import { useEffect, useState } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import { api } from "../lib/api/client";
import type { MyPageData, StaffData } from "../lib/api/types";
import { Eye, EyeOff, Plus } from "lucide-react";

export default function Mypage() {
  const [me, setMe] = useState<MyPageData | null>(null);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [addingStaff, setAddingStaff] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newStaffPw, setNewStaffPw] = useState("");

  useEffect(() => {
    api.get("/api/users/me").then((d: unknown) => setMe(d as MyPageData));
    api.get("/api/users/staff").then((d: unknown) => setStaff(d as StaffData[]));
  }, []);

  const handleChangePassword = async () => {
    try {
      await api.patch("/api/users/password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      alert("비밀번호가 변경되었습니다.");
      setChangingPw(false);
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      console.error(err);
      alert("비밀번호 변경에 실패했습니다.");
    }
  };

  const handleAddStaff = async () => {
    try {
      await api.post("/api/users/staff", { email: newEmail, password: newStaffPw });
      setAddingStaff(false);
      setNewEmail("");
      setNewStaffPw("");
      const updated = (await api.get("/api/users/staff")) as unknown as StaffData[];
      setStaff(updated);
    } catch (err) {
      console.error(err);
      alert("직원 추가에 실패했습니다.");
    }
  };

  const handleToggleStaff = async (staffId: number) => {
    try {
      await api.patch(`/api/users/staff/${staffId}/toggle-active`);
      const updated = (await api.get("/api/users/staff")) as unknown as StaffData[];
      setStaff(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout activeMenu={0}>
      <div className="pt-9 flex flex-col gap-6 max-w-[800px]">
        <h1
          className="text-[24px] font-bold text-Neutral-900"
          style={{ fontFamily: "Pretendard" }}
        >
          마이페이지
        </h1>

        {/* 기본 정보 */}
        <TableLayout>
          <div className="flex flex-col gap-5">
            <h2 className="text-[18px] font-bold text-Neutral-900">기본 정보</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-Neutral-600 w-[100px]">이메일</span>
                <span className="text-sm text-Neutral-900 flex-1">{me?.email ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-Neutral-600 w-[100px]">권한</span>
                <span className="text-sm text-Neutral-900 flex-1">{me?.role ?? "-"}</span>
              </div>
              {!changingPw ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-Neutral-600 w-[100px]">비밀번호</span>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm text-Neutral-900">••••••••</span>
                    <button onClick={() => setChangingPw(true)} className="text-xs text-Brand-2 font-medium hover:underline">변경</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4 bg-Neutral-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-Neutral-600 w-[100px] shrink-0">현재 비밀번호</span>
                    <div className="relative flex-1">
                      <input type={showCurrentPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full h-10 px-3 pr-10 rounded-md border border-Neutral-400 outline-none text-sm" />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showCurrentPw ? <Eye size={18} color="#5B6064" /> : <EyeOff size={18} color="#5B6064" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-Neutral-600 w-[100px] shrink-0">새 비밀번호</span>
                    <div className="relative flex-1">
                      <input type={showNewPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full h-10 px-3 pr-10 rounded-md border border-Neutral-400 outline-none text-sm" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showNewPw ? <Eye size={18} color="#5B6064" /> : <EyeOff size={18} color="#5B6064" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setChangingPw(false); setCurrentPw(""); setNewPw(""); }} className="px-3 py-1.5 text-sm text-Neutral-600 hover:bg-Neutral-200 rounded-md transition-colors">취소</button>
                    <button onClick={handleChangePassword} className="px-3 py-1.5 text-sm bg-Brand-2 text-white rounded-md hover:opacity-90 transition-opacity">변경</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TableLayout>

        {/* 직원 관리 */}
        {me && (me.role === "MASTER" || me.role === "ADMIN") && (
          <TableLayout>
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-Neutral-900">직원 관리</h2>
                <button onClick={() => setAddingStaff(true)} className="flex items-center gap-1 text-sm text-Brand-2 font-medium hover:underline">
                  <Plus size={16} />직원 추가
                </button>
              </div>
              {addingStaff && (
                <div className="flex items-end gap-3 p-4 bg-Neutral-100 rounded-lg">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-Neutral-600">이메일</span>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-10 px-3 rounded-md border border-Neutral-400 outline-none text-sm" />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-Neutral-600">비밀번호</span>
                    <input type="password" value={newStaffPw} onChange={(e) => setNewStaffPw(e.target.value)} className="h-10 px-3 rounded-md border border-Neutral-400 outline-none text-sm" />
                  </div>
                  <button onClick={handleAddStaff} className="h-10 px-4 bg-Brand-2 text-white text-sm rounded-md hover:opacity-90 transition-opacity">추가</button>
                  <button onClick={() => { setAddingStaff(false); setNewEmail(""); setNewStaffPw(""); }} className="h-10 px-3 text-sm text-Neutral-600 hover:bg-Neutral-200 rounded-md transition-colors">취소</button>
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-Neutral-900 text-white">
                    <th className="px-4 py-3 text-center font-medium rounded-tl-lg w-[60px]">상태</th>
                    <th className="px-4 py-3 text-left font-medium">이메일</th>
                    <th className="px-4 py-3 text-left font-medium">권한</th>
                    <th className="px-4 py-3 text-left font-medium rounded-tr-lg">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-Neutral-200">
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggleStaff(s.id)} className="inline-flex items-center justify-center">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.active ? "bg-Green-500" : "bg-Red-500"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-Neutral-900">{s.email}</td>
                      <td className="px-4 py-3 text-Neutral-700">{s.role}</td>
                      <td className="px-4 py-3 text-Neutral-700">{s.createdAt?.split("T")[0] ?? "-"}</td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-Neutral-500">등록된 직원이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableLayout>
        )}
      </div>
    </Layout>
  );
}
