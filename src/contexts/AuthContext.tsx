import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  role: 'operador' | 'supervisor';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuários padrão
const defaultUsers = [
  { email: 'admin@gmail.com', password: 'admin', role: 'supervisor' as const, name: 'Administrador' },
  { email: 'operador@gmail.com', password: 'operador', role: 'operador' as const, name: 'Operador' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('safety-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const foundUser = defaultUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const userToSave = {
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
      };
      setUser(userToSave);
      localStorage.setItem('safety-user', JSON.stringify(userToSave));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('safety-user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
