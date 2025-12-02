import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LoginResponse } from "@/types/pipeline";

interface AuthContextValue {
  user: LoginResponse | null;
  login: (user: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "learningpipeline:user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);

  useEffect(() => {
    // 과거에 저장된 자동 로그인 정보는 지우고, 매 세션마다 로그인하도록 유지
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = (payload: LoginResponse) => {
      setUser(payload);
    };

    const logout = () => {
      setUser(null);
    };

    return { user, login, logout };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
