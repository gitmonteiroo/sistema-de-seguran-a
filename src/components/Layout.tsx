import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  FileWarning, 
  FileText, 
  LogOut,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardCheck, label: 'Checklists', path: '/checklists' },
    { icon: FileWarning, label: 'Não Conformidades', path: '/nao-conformidades' },
    { icon: AlertTriangle, label: 'Ocorrências', path: '/ocorrencias' },
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  ];

  if (user?.role === 'supervisor') {
    menuItems.splice(4, 0, { 
      icon: Shield, 
      label: 'Supervisão', 
      path: '/supervisao' 
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Sistema de Segurança Industrial</h1>
              <p className="text-xs opacity-90">Checklists e Ocorrências</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs opacity-90 capitalize">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap',
                    isActive ? 'bg-primary text-primary-foreground' : ''
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Desenvolvido por:{' '}
            <a
              href="https://www.linkedin.com/in/cesar-monteiro-030bb3170"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              César Monteiro
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
