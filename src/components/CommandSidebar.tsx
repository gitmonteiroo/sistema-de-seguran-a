import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileWarning,
  AlertTriangle,
  FileText,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Camera,
  Settings,
  History,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const CommandSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    { icon: ClipboardCheck, label: 'Checklists', path: '/checklists' },
    { icon: FileWarning, label: 'Não Conformidades', path: '/nao-conformidades' },
    { icon: AlertTriangle, label: 'Ocorrências', path: '/ocorrencias' },
  ];

  // Supervisor-only items
  const supervisorNavItems: NavItem[] = user?.role === 'supervisor' ? [
    { icon: Shield, label: 'Centro de Comando', path: '/supervisao' },
    { icon: Camera, label: 'Monitorização', path: '/supervisao?tab=cameras' },
    { icon: History, label: 'Histórico', path: '/supervisao?tab=history' },
  ] : [];

  const secondaryNavItems: NavItem[] = [
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Definições', path: '/definicoes' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavButton = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    const Icon = item.icon;

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(item.path)}
              className={cn(
                'w-10 h-10 relative transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-glow-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-mono">
                  {item.badge}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-card border-border">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Button
        variant="ghost"
        onClick={() => navigate(item.path)}
        className={cn(
          'w-full justify-start gap-3 h-10 px-3 transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-glow-primary'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-mono">
            {item.badge}
          </span>
        )}
      </Button>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border h-16 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Centro de Comando</span>
              <span className="text-xs text-sidebar-foreground/60">Segurança Industrial</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
              Principal
            </p>
          )}
          {mainNavItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>

        {/* Supervisor Navigation */}
        {supervisorNavItems.length > 0 && (
          <div className="space-y-1 pt-4 mt-4 border-t border-sidebar-border">
            {!collapsed && (
              <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
                Supervisão
              </p>
            )}
            {supervisorNavItems.map((item) => (
              <NavButton
                key={item.path}
                item={item}
                isActive={location.pathname === item.path.split('?')[0]}
              />
            ))}
          </div>
        )}

        {/* Secondary Navigation */}
        <div className="space-y-1 pt-4 mt-4 border-t border-sidebar-border">
          {!collapsed && (
            <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
              Sistema
            </p>
          )}
          {secondaryNavItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className={cn(
        'border-t border-sidebar-border p-3',
        collapsed ? 'flex flex-col items-center gap-2' : ''
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-10 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card border-border">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Button>
        )}
      </div>
    </aside>
  );
};

export default CommandSidebar;
