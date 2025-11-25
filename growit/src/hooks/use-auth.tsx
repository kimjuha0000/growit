import { createContext, useContext, useMemo, useState } from "react";
import type { LoginResponse } from "@/types/pipeline";

interface AuthContextValue {
  user: LoginResponse | null;
  login: (user: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "learningpipeline:user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(() => {
    const login = (payload: LoginResponse) => {
      setUser(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    };

    const logout = () => {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
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
