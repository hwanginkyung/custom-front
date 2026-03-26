import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut } from "lucide-react";
import { api } from "../../lib/api/client";
import { clearTokens } from "../../lib/auth/token";
import { getErrorMessage } from "../../lib/error/getErrorMessage";

interface LayoutProps {
  children: React.ReactNode;
  activeMenu: number;
}

export default function Layout({ children, activeMenu }: LayoutProps) {
  const navigate = useNavigate();

  const menus: Array<[string, string]> = [
    ["대시보드", "/dashboard"],
    ["케이스 관리", "/cases"],
    ["반입 체크", "/arrival"],
    ["화주 관리", "/clients"],
    ["NCustoms", "/ncustoms/temp-save"],
  ];

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout API Error", err);
    } finally {
      clearTokens();
      alert("로그아웃 되었습니다.");
      navigate("/login");
    }
  };

  const handleMypageClick = async () => {
    try {
      await api.get("/api/users/me");
      navigate("/mypage");
    } catch (error) {
      alert(getErrorMessage(error, "접근 권한이 없습니다."));
    }
  };

  const Divider = () => (
    <div className="w-[2px] h-[40px] bg-[#E6E8EC] rounded-[2px] shrink-0" />
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-[80px] w-full items-center bg-white px-[120px] shadow-sm border-b border-neutral-100">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center">
            {/* Logo */}
            <div
              className="cursor-pointer flex items-baseline gap-1.5 shrink-0"
              onClick={() => navigate("/dashboard")}
            >
              <span
                className="text-[22px] font-bold text-[#1038C6] tracking-tight"
                style={{ fontFamily: "Pretendard" }}
              >
                Cariv Partners
              </span>
              <span
                className="text-[14px] font-medium text-Neutral-600"
                style={{ fontFamily: "Pretendard" }}
              >
                for 관세사
              </span>
            </div>

            <div className="ml-[32px]">
              <Divider />
            </div>

            <nav className="flex items-center ml-[32px]">
              {menus.map(([menu, route], index) => {
                const isActive = activeMenu === index + 1;
                return (
                  <React.Fragment key={index}>
                    <div
                      onClick={() => navigate(route)}
                      className={`text-[18px] font-medium leading-[32px] tracking-[0.2px] cursor-pointer whitespace-nowrap ${
                        isActive ? "text-Brand-2" : "text-Neutral-600"
                      }`}
                      style={{
                        fontFeatureSettings: "'liga' off, 'clig' off",
                        fontFamily: "Pretendard",
                      }}
                    >
                      {menu}
                    </div>
                    {index < menus.length - 1 && <div className="w-[32px]" />}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center">
            <Divider />
            <div className="flex items-center ml-[32px]">
              <button
                type="button"
                className="flex items-center justify-center w-[44px] h-[44px] hover:bg-neutral-50 rounded-md transition-colors"
              >
                <Bell size={22} className="text-Neutral-700" />
              </button>

              <button
                type="button"
                onClick={handleMypageClick}
                className="flex items-center justify-center w-[44px] h-[44px] ml-[6px] hover:bg-neutral-50 rounded-md transition-colors"
              >
                <User size={22} className="text-Neutral-700" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center w-[44px] h-[44px] ml-[8px] hover:bg-Red-50 rounded-md transition-colors"
              >
                <LogOut size={22} className="text-Neutral-700" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-[#f9f9f9] px-[54px] pt-0 pb-[61px]">
        {children}
      </main>
    </div>
  );
}
