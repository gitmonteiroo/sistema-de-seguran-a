import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  FileWarning, 
  TrendingUp 
} from 'lucide-react';
import { getAllChecklists, getAllNaoConformidades, getAllOcorrencias } from '@/lib/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [stats, setStats] = useState({
    checklistsHoje: 0,
    ocorrenciasTotal: 0,
    naoConformidadesTotal: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    
    const checklists = await getAllChecklists();
    const ocorrencias = await getAllOcorrencias();
    const naoConformidades = await getAllNaoConformidades();

    const checklistsHoje = checklists.filter((c) => c.data === hoje);

    setStats({
      checklistsHoje: checklistsHoje.length,
      ocorrenciasTotal: ocorrencias.length,
      naoConformidadesTotal: naoConformidades.length,
    });

    // Pegar últimas não conformidades
    const recent = naoConformidades
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentItems(recent);
  };

  const statCards = [
    {
      title: 'Checklists Hoje',
      value: stats.checklistsHoje,
      icon: ClipboardCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Ocorrências',
      value: stats.ocorrenciasTotal,
      icon: AlertTriangle,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Não Conformidades',
      value: stats.naoConformidadesTotal,
      icon: FileWarning,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Taxa de Conformidade',
      value: '94%',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Visão geral das operações de segurança e qualidade
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Últimas Não Conformidades */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Últimas Não Conformidades</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma não conformidade registrada ainda
            </p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-destructive/10 rounded-lg flex-shrink-0">
                    <FileWarning className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <p className="font-semibold text-sm md:text-base truncate">{item.tipo}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Turno {item.turno}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1 line-clamp-2">
                      {item.descricao}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground">
                      <span>{item.local}</span>
                      <span className="hidden md:inline">
                        {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                      <span className="md:hidden">
                        {format(new Date(item.createdAt), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
