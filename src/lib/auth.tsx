"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  role: "admin" | "artist" | "receptionist";
  email: string;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Mock kullanıcılar — Supabase entegrasyonunda değişir
const MOCK_USERS: (User & { password: string })[] = [
  { id: "u1", name: "Admin",        role: "admin",        email: "admin@raveink.com",       password: "admin123" },
  { id: "u2", name: "Mert Kaya",    role: "artist",       email: "mert@raveink.com",        password: "mert123" },
  { id: "u3", name: "Resepsiyon",   role: "receptionist", email: "resepsiyon@raveink.com",  password: "rave123" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("erp_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return false;
    const { password: _, ...u } = found;
    setUser(u);
    localStorage.setItem("erp_user", JSON.stringify(u));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("erp_user");
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
