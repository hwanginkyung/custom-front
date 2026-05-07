import { useEffect, useState, useCallback } from "react";
import Layout from "../component/layout/Layout";
import TableLayout from "../component/layout/TableLayout";
import { api } from "../lib/api/client";
import type { MyPageData, StaffData } from "../lib/api/types";
import { Eye, EyeOff, Plus, CheckCircle2, XCircle, Clock, Building2 } from "lucide-react";

interface ConnectionRequest {
  id: number;
  exporterCompanyId: number;
  exporterCompanyName: string;
  exporterBusinessNumber: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  approvedAt: string | null;
  matchedClientId: number | null;
  matchedClientName: string | null;
  matchedBy: "EXTERNAL_CODE" | "BUSINESS_NUMBER" | "COMPANY_NAME" | null;
  linkedClientId: number | null;
  linkedClientName: string | null;
}

export default function Mypage() {
  const [me, setMe] = useState<MyPageData | null>(null);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [ncustomsUserCode, setNcustomsUserCode] = useState("");
  const [ncustomsWriterId, setNcustomsWriterId] = useState("");
  const [ncustomsWriterName, setNcustomsWriterName] = useState("");
  const [savingNcustomsProfile, setSavingNcustomsProfile] = useState(false);

  const [addingStaff, setAddingStaff] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newStaffPw, setNewStaffPw] = useState("");

  // 연동 요청 상태
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setConnectionLoading(true);
    try {
      const res = await api.get("/api/broker-connection/requests");
      setConnectionRequests(res as unknown as ConnectionRequest[]);
      setConnectionError(null);
    } catch {
      setConnectionError("연동 요청을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.");
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  const handleApprove = async (id: number, name: string) => {
    const req = connectionRequests.find((item) => item.id === id);
    let approveUrl = `/api/broker-connection/requests/${id}/approve`;

    if (req?.matchedClientId && req?.matchedClientName) {
      const matchedByLabel =
        req.matchedBy === "EXTERNAL_CODE" ? "기존 연동코드" :
        req.matchedBy === "BUSINESS_NUMBER" ? "사업자번호" :
        req.matchedBy === "COMPANY_NAME" ? "업체명" : "자동 매칭";

      const useMatchedClient = window.confirm(
        `${name} 요청이 "${req.matchedClientName}" 화주와 매칭되었습니다. (${matchedByLabel})\n이 화주와 매칭하시겠습니까?`
      );
      if (useMatchedClient) {
        approveUrl = `${approveUrl}?matchedClientId=${req.matchedClientId}`;
      } else if (!window.confirm(`${name} 요청을 매칭 없이 수동 승인하시겠습니까?`)) {
        return;
      }
    } else if (!window.confirm(`${name}의 연동 요청을 승인하시겠습니까?`)) {
      return;
    }

    try {
      await api.patch(approveUrl);
      await loadConnections();
    } catch {
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (id: number, name: string) => {
    if (!window.confirm(`${name}의 연동 요청을 거절하시겠습니까?`)) return;
    try {
      await api.patch(`/api/broker-connection/requests/${id}/reject`);
      await loadConnections();
    } catch {
      alert("거절에 실패했습니다.");
    }
  };

  useEffect(() => {
    api.get("/api/users/me").then((d: unknown) => {
      const data = d as MyPageData;
      setMe(data);
      setNcustomsUserCode(data.ncustomsUserCode ?? "");
      setNcustomsWriterId(data.ncustomsWriterId ?? "");
      setNcustomsWriterName(data.ncustomsWriterName ?? "");
    });
    api.get("/api/users/staff").then((d: unknown) => setStaff(d as StaffData[]));
    void loadConnections();
  }, []);

  const handleSaveNcustomsProfile = async () => {
    setSavingNcustomsProfile(true);
    try {
      const updated = await api.patch("/api/users/me/ncustoms-profile", {
        ncustomsUserCode,
        ncustomsWriterId,
        ncustomsWriterName,
      });
      const meData = updated as unknown as MyPageData;
      setMe(meData);
      setNcustomsUserCode(meData.ncustomsUserCode ?? "");
      setNcustomsWriterId(meData.ncustomsWriterId ?? "");
      setNcustomsWriterName(meData.ncustomsWriterName ?? "");
      alert("NCustoms 연동 정보가 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("NCustoms 연동 정보 저장에 실패했습니다.");
    } finally {
      setSavingNcustomsProfile(false);
    }
  };

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

              <div className="mt-2 rounded-lg border border-Neutral-200 bg-Neutral-100 p-4">
                <div className="mb-3 text-sm font-semibold text-Neutral-900">NCustoms 연동 정보</div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-Neutral-600 w-[120px] shrink-0">사용자코드</span>
                    <input
                      type="text"
                      value={ncustomsUserCode}
                      onChange={(e) => setNcustomsUserCode(e.target.value)}
                      className="h-10 flex-1 px-3 rounded-md border border-Neutral-400 outline-none text-sm"
                      placeholder="예: 4"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-Neutral-600 w-[120px] shrink-0">작성자 ID</span>
                    <input
                      type="text"
                      value={ncustomsWriterId}
                      onChange={(e) => setNcustomsWriterId(e.target.value)}
                      className="h-10 flex-1 px-3 rounded-md border border-Neutral-400 outline-none text-sm"
                      placeholder="예: staff01"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-Neutral-600 w-[120px] shrink-0">작성자명</span>
                    <input
                      type="text"
                      value={ncustomsWriterName}
                      onChange={(e) => setNcustomsWriterName(e.target.value)}
                      className="h-10 flex-1 px-3 rounded-md border border-Neutral-400 outline-none text-sm"
                      placeholder="예: 홍길동"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNcustomsProfile}
                    disabled={savingNcustomsProfile}
                    className="h-9 px-4 rounded-md bg-Brand-2 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {savingNcustomsProfile ? "저장 중..." : "NCustoms 저장"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TableLayout>

        {/* 수출자 연동 요청 */}
        <TableLayout>
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-Neutral-900 flex items-center gap-2">
                <Building2 size={20} />
                수출자 연동 요청
                {connectionRequests.filter(r => r.status === "PENDING").length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-medium">
                    {connectionRequests.filter(r => r.status === "PENDING").length}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => void loadConnections()}
                disabled={connectionLoading}
                className="h-8 px-3 rounded-md border border-Neutral-300 text-xs font-medium text-Neutral-700 hover:bg-Neutral-100 disabled:opacity-60"
              >
                {connectionLoading ? "조회 중..." : "새로고침"}
              </button>
            </div>

            {connectionError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {connectionError}
              </div>
            )}

            {connectionRequests.length === 0 ? (
              <div className="py-8 text-center text-Neutral-500 text-sm">
                {connectionLoading ? "연동 요청을 불러오는 중입니다." : "들어온 연동 요청이 없습니다."}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {connectionRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      req.status === "PENDING"
                        ? "border-yellow-300 bg-yellow-50"
                        : req.status === "APPROVED"
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        req.status === "PENDING" ? "bg-yellow-200" :
                        req.status === "APPROVED" ? "bg-green-200" : "bg-red-200"
                      }`}>
                        {req.status === "PENDING" && <Clock size={18} className="text-yellow-700" />}
                        {req.status === "APPROVED" && <CheckCircle2 size={18} className="text-green-700" />}
                        {req.status === "REJECTED" && <XCircle size={18} className="text-red-700" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-Neutral-900">{req.exporterCompanyName}</p>
                        <p className="text-xs text-Neutral-600">
                          {req.requestedAt?.split("T")[0] ?? ""} 요청
                          {req.status === "APPROVED" && " · 승인 완료"}
                          {req.status === "REJECTED" && " · 거절됨"}
                        </p>
                      </div>
                    </div>

                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.exporterCompanyName)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.exporterCompanyName)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                        >
                          거절
                        </button>
                      </div>
                    )}
                    {req.status === "APPROVED" && (
                      <span className="px-3 py-1 text-xs text-green-700 bg-green-100 rounded-full font-medium">연동중</span>
                    )}
                  </div>
                ))}
              </div>
            )}
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
