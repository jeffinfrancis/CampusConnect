
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";
import type {
  User,
  UserRole,
  AuthResponse,
} from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<User>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) as User : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const saveAuth = (data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const login = async (email: string, password: string): Promise<User> => {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  saveAuth(response.data);
  return response.data.user;
};

const register = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<User> => {
  const response = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
    role,
  });

  saveAuth(response.data);
  return response.data.user;
};

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
