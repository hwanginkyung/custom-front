import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "./lib/auth/token";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const LoginPage = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const CasesPage = lazy(() => import("./pages/Cases"));
const CaseDetailPage = lazy(() => import("./pages/CaseDetail"));
const ArrivalCheckPage = lazy(() => import("./pages/ArrivalCheck"));
const ClientsPage = lazy(() => import("./pages/Clients"));
const MypagePage = lazy(() => import("./pages/Mypage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-Neutral-600">
      로딩 중...
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
        <Route path="/cases/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
        <Route path="/arrival" element={<ProtectedRoute><ArrivalCheckPage /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MypagePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
