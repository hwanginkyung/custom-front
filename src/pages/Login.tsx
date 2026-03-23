import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api/client";
import { setAccessToken, setRefreshToken } from "../lib/auth/token";
import type { TokenResponse } from "../lib/api/types";

type LoginInputProps = {
  label: string;
  type?: "text" | "password";
  value: string;
  onChange: (value: string) => void;
};

function LoginInput({ label, type = "text", value, onChange }: LoginInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2 w-full">
      <p
        className="font-medium text-base leading-[28px] tracking-[0.2px] text-black"
        style={{
          fontFeatureSettings: "'liga' off, 'clig' off",
          fontFamily: "Pretendard",
        }}
      >
        {label}
      </p>
      <div className="relative flex items-center h-[40px] w-full self-stretch border border-Neutral-300 rounded-md overflow-hidden px-[15px]">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={isPassword && showPassword ? "text" : type}
          className="w-full h-full py-2 pr-10 outline-none bg-transparent"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-Neutral-400"
            aria-label="비밀번호 보기/숨기기"
          >
            {showPassword ? (
              <Eye size={24} color="#5B6064" />
            ) : (
              <EyeOff size={24} color="#5B6064" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const data: TokenResponse = await api.post("/api/auth/login", { email, password });
      if (!data?.accessToken) {
        throw new Error("로그인 실패: 토큰 없음");
      }
      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (error instanceof Error) alert(error.message);
      else alert("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-white overflow-y-auto">
      {/* Logo */}
      <div className="mt-[26vh] mb-[47px] flex flex-col items-center shrink-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[32px] font-bold text-[#1038C6] tracking-tight"
            style={{ fontFamily: "Pretendard" }}
          >
            Cariv Partners
          </span>
          <span
            className="text-[16px] font-medium text-Neutral-600"
            style={{ fontFamily: "Pretendard" }}
          >
            for 관세사
          </span>
        </div>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleLogin}
        className="flex flex-col w-[429px] max-w-[95%] p-[24px_23px] items-center gap-[28px] rounded-lg outline outline-1 outline-offset-[-1px] outline-Neutral-300 shadow-sm"
      >
        <div className="flex flex-col w-full gap-[8px]">
          <LoginInput label="이메일" value={email} onChange={setEmail} />
          <div className="mt-[4px]">
            <LoginInput
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[48px] px-4 py-2.5 bg-Brand-2 rounded-lg text-white disabled:bg-gray-400 transition-colors"
        >
          <span className="font-medium">로그인</span>
        </button>
      </form>
      <div className="h-20 w-full shrink-0" />
    </div>
  );
}
