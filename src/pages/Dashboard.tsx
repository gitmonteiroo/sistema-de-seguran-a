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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das operações de segurança e qualidade
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Últimas Não Conformidades */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Não Conformidades</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma não conformidade registrada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <FileWarning className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{item.tipo}</p>
                      <span className="text-xs text-muted-foreground">
                        Turno {item.turno}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {item.descricao}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.local}</span>
                      <span>
                        {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", {
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
