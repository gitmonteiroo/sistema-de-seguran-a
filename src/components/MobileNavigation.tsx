import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileWarning,
  AlertTriangle,
  Menu,
  Shield,
  FileText,
  Settings,
  Users,
  LogOut,
  X,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const MobileNavigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: ClipboardCheck, label: 'Checklists', path: '/checklists' },
    { icon: FileWarning, label: 'NC', path: '/nao-conformidades' },
    { icon: AlertTriangle, label: 'Ocorrências', path: '/ocorrencias' },
  ];

  const supervisorNavItems: NavItem[] = user?.role === 'supervisor' ? [
    { icon: Shield, label: 'Supervisão', path: '/supervisao' },
    { icon: Users, label: 'Utilizadores', path: '/utilizadores' },
  ] : [];

  const secondaryNavItems: NavItem[] = [
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Definições', path: '/definicoes' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-bottom md:hidden">
        <div className="flex items-stretch justify-around h-16">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors touch-manipulation',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground active:bg-sidebar-accent'
                )}
              >
                <Icon className={cn('h-6 w-6', active && 'text-primary')} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
          
          {/* Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors touch-manipulation',
                  'text-muted-foreground active:bg-sidebar-accent'
                )}
              >
                <Menu className="h-6 w-6" />
                <span className="text-[10px] font-medium leading-none">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{user?.name || 'Utilizador'}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user?.role || 'operador'}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-2">
                {/* Supervisor Items */}
                {supervisorNavItems.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 pt-2">
                      Supervisão
                    </p>
                    {supervisorNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.path}
                          variant={isActive(item.path) ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-14 text-base gap-4"
                          onClick={() => handleNavigate(item.path)}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      );
                    })}
                    <Separator className="my-3" />
                  </>
                )}

                {/* Secondary Items */}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                  Sistema
                </p>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'secondary' : 'ghost'}
                      className="w-full justify-start h-14 text-base gap-4"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  );
                })}

                <Separator className="my-3" />

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-14 text-base gap-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" />
    </>
  );
};

export default MobileNavigation;
