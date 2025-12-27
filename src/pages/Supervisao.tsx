import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getAllChecklists, getAllNaoConformidades, getAllOcorrencias } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield,
  ClipboardCheck,
  FileWarning,
  AlertTriangle,
  Filter,
  Activity,
  Camera,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import SystemChart from '@/components/SystemChart';
import AlertsTable, { AlertRecord } from '@/components/AlertsTable';

const Supervisao = () => {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [naoConformidades, setNaoConformidades] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [filtroSetor, setFiltroSetor] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [selectedNaoConformidade, setSelectedNaoConformidade] = useState<any>(null);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const { toast } = useToast();

  // Generate simulated chart data
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date().getHours() - 23 + i + 24) % 24;
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        value: Math.floor(Math.random() * 30) + 50, // 50-80 range for temperature
      };
    });
    return hours;
  }, []);

  // Calculate days without accidents
  const diasSemAcidentes = useMemo(() => {
    const acidentes = ocorrencias.filter(o => o.tipo === 'acidente');
    if (acidentes.length === 0) return 45; // Default if no accidents
    const ultimoAcidente = new Date(acidentes[0].createdAt);
    return differenceInDays(new Date(), ultimoAcidente);
  }, [ocorrencias]);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates for não conformidades
    const naoConformidadesChannel = supabase
      .channel('nao_conformidades_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nao_conformidades'
        },
        (payload) => {
          console.log('Nova não conformidade:', payload);
          toast({
            title: "⚠️ Nova Não Conformidade",
            description: `${payload.new.tipo} - ${payload.new.local}`,
            variant: "destructive",
          });
          loadData();
          // Add to alerts
          const newAlert: AlertRecord = {
            id: `NC-${payload.new.id.slice(0, 6)}`,
            zone: payload.new.local,
            type: payload.new.tipo,
            severity: 'warning',
            timestamp: new Date().toISOString(),
            status: 'active',
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    // Subscribe to real-time updates for ocorrências
    const ocorrenciasChannel = supabase
      .channel('ocorrencias_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ocorrencias'
        },
        (payload) => {
          console.log('Nova ocorrência:', payload);
          toast({
            title: "🚨 Nova Ocorrência",
            description: `${payload.new.tipo.replace('-', ' ').toUpperCase()} - ${payload.new.setor}`,
            variant: "destructive",
          });
          loadData();
          // Add to alerts
          const newAlert: AlertRecord = {
            id: `OC-${payload.new.id.slice(0, 6)}`,
            zone: payload.new.setor,
            type: payload.new.tipo.replace('-', ' '),
            severity: payload.new.tipo === 'acidente' ? 'critical' : 'warning',
            timestamp: new Date().toISOString(),
            status: 'active',
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(naoConformidadesChannel);
      supabase.removeChannel(ocorrenciasChannel);
    };
  }, [toast]);

  const loadData = async () => {
    const checklistsData = await getAllChecklists();
    const naoConformidadesData = await getAllNaoConformidades();
    const ocorrenciasData = await getAllOcorrencias();

    setChecklists(checklistsData.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setNaoConformidades(naoConformidadesData.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setOcorrencias(ocorrenciasData.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));

    // Generate initial alerts from existing data
    const initialAlerts: AlertRecord[] = [
      ...naoConformidadesData.slice(0, 3).map((nc: any, i: number) => ({
        id: `NC-${nc.id.slice(0, 6)}`,
        zone: nc.local,
        type: nc.tipo,
        severity: 'warning' as const,
        timestamp: nc.createdAt,
        status: i === 0 ? 'active' as const : 'resolved' as const,
      })),
      ...ocorrenciasData.slice(0, 2).map((o: any, i: number) => ({
        id: `OC-${o.id.slice(0, 6)}`,
        zone: o.setor,
        type: o.tipo.replace('-', ' '),
        severity: o.tipo === 'acidente' ? 'critical' as const : 'warning' as const,
        timestamp: o.createdAt,
        status: i === 0 ? 'active' as const : 'resolved' as const,
      })),
    ];
    setAlerts(initialAlerts);
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, status: 'resolved' as const } : alert
      )
    );
    toast({
      title: "✅ Alerta Resolvido",
      description: `O alerta ${id} foi marcado como resolvido.`,
    });
  };

  // Aplicar todos os filtros
  const checklistsFiltrados = checklists.filter(c => {
    if (filtroTurno !== 'todos' && c.turno.toString() !== filtroTurno) return false;
    if (filtroDataInicio && c.data < filtroDataInicio) return false;
    if (filtroDataFim && c.data > filtroDataFim) return false;
    return true;
  });

  const naoConformidadesFiltradas = naoConformidades.filter(nc => {
    if (filtroTurno !== 'todos' && nc.turno.toString() !== filtroTurno) return false;
    if (filtroDataInicio && nc.data < filtroDataInicio) return false;
    if (filtroDataFim && nc.data > filtroDataFim) return false;
    if (filtroSetor !== 'todos' && nc.local !== filtroSetor) return false;
    if (filtroTipo !== 'todos' && nc.tipo !== filtroTipo) return false;
    return true;
  });

  const ocorrenciasFiltradas = ocorrencias.filter(o => {
    if (filtroDataInicio && o.data < filtroDataInicio) return false;
    if (filtroDataFim && o.data > filtroDataFim) return false;
    if (filtroSetor !== 'todos' && o.setor !== filtroSetor) return false;
    if (filtroTipo !== 'todos' && o.tipo !== filtroTipo) return false;
    return true;
  });

  // Extrair valores únicos para os filtros
  const setoresUnicos = [...new Set([
    ...naoConformidades.map(nc => nc.local),
    ...ocorrencias.map(o => o.setor)
  ])].filter(Boolean).sort();

  const tiposNaoConformidade = [...new Set(naoConformidades.map(nc => nc.tipo))].filter(Boolean).sort();
  const tiposOcorrencia = [...new Set(ocorrencias.map(o => o.tipo))].filter(Boolean).sort();

  // Calculate active incidents
  const incidentesAtivos = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            Centro de Comando
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitorização em tempo real de segurança e qualidade
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Status do Sistema"
          value={systemStatus === 'online' ? 'Online' : 'Offline'}
          subtitle="Todos os serviços operacionais"
          icon={systemStatus === 'online' ? Wifi : WifiOff}
          variant={systemStatus === 'online' ? 'success' : 'danger'}
        />
        <StatCard
          title="Incidentes Ativos"
          value={incidentesAtivos}
          subtitle="Aguardando resolução"
          icon={AlertTriangle}
          variant={incidentesAtivos > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Câmaras Online"
          value="24/24"
          subtitle="100% de cobertura"
          icon={Camera}
          variant="primary"
        />
        <StatCard
          title="Dias sem Acidentes"
          value={diasSemAcidentes}
          subtitle="Meta: 60 dias"
          icon={Clock}
          variant={diasSemAcidentes >= 30 ? 'success' : 'warning'}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* System Chart */}
      <SystemChart
        data={chartData}
        title="Temperatura dos Servidores"
        description="Monitorização nas últimas 24 horas"
        color="hsl(217, 91%, 60%)"
        unit="°C"
      />

      {/* Alerts Table */}
      <AlertsTable
        alerts={alerts}
        onResolve={handleResolveAlert}
        title="Registos Recentes"
        description="Alertas e incidentes do sistema em tempo real"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filtro-turno" className="text-xs text-muted-foreground uppercase tracking-wider">Turno</Label>
              <Select value={filtroTurno} onValueChange={setFiltroTurno}>
                <SelectTrigger id="filtro-turno" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Turnos</SelectItem>
                  <SelectItem value="1">Turno 1</SelectItem>
                  <SelectItem value="2">Turno 2</SelectItem>
                  <SelectItem value="3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-data-inicio" className="text-xs text-muted-foreground uppercase tracking-wider">Data Início</Label>
              <Input
                id="filtro-data-inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="filtro-data-fim" className="text-xs text-muted-foreground uppercase tracking-wider">Data Fim</Label>
              <Input
                id="filtro-data-fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="filtro-setor" className="text-xs text-muted-foreground uppercase tracking-wider">Setor/Local</Label>
              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger id="filtro-setor" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  {setoresUnicos.map(setor => (
                    <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-tipo" className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger id="filtro-tipo" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {[...tiposNaoConformidade, ...tiposOcorrencia].map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklists */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Checklists
              <Badge variant="secondary" className="ml-auto font-mono">
                {checklistsFiltrados.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Últimos preenchimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {checklistsFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                Nenhum checklist encontrado
              </p>
            ) : (
              <div className="space-y-3">
                {checklistsFiltrados.slice(0, 5).map((checklist) => {
                  const totalItems = checklist.items.length;
                  const conformes = checklist.items.filter((i: any) => i.resposta).length;
                  const porcentagem = Math.round((conformes / totalItems) * 100);

                  return (
                    <div
                      key={checklist.id}
                      onClick={() => setSelectedChecklist(checklist)}
                      className="p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{checklist.operador}</p>
                        <Badge
                          variant={porcentagem === 100 ? 'default' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {porcentagem}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Turno {checklist.turno}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(checklist.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Não Conformidades */}
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="w-5 h-5 text-warning" />
              Não Conformidades
              <Badge variant="outline" className="ml-auto font-mono border-warning/30 text-warning">
                {naoConformidadesFiltradas.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Situações não conformes
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {naoConformidadesFiltradas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                Nenhuma não conformidade
              </p>
            ) : (
              <div className="space-y-3">
                {naoConformidadesFiltradas.slice(0, 5).map((nc) => (
                  <div
                    key={nc.id}
                    onClick={() => setSelectedNaoConformidade(nc)}
                    className="p-3 rounded-lg border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{nc.tipo}</p>
                      <Badge variant="outline" className="text-xs border-warning/30 text-warning">
                        T{nc.turno}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{nc.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{nc.local}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(nc.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ocorrências */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Ocorrências
              <Badge variant="outline" className="ml-auto font-mono border-destructive/30 text-destructive">
                {ocorrenciasFiltradas.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Acidentes e incidentes
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {ocorrenciasFiltradas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                Nenhuma ocorrência
              </p>
            ) : (
              <div className="space-y-3">
                {ocorrenciasFiltradas.slice(0, 5).map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    onClick={() => setSelectedOcorrencia(ocorrencia)}
                    className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm capitalize">{ocorrencia.tipo.replace('-', ' ')}</p>
                      <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                        {ocorrencia.setor}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ocorrencia.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ocorrencia.operador}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(ocorrencia.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Checklist */}
      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Detalhes do Checklist
            </DialogTitle>
            <DialogDescription>
              Informações completas do checklist realizado
            </DialogDescription>
          </DialogHeader>
          {selectedChecklist && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-semibold">{selectedChecklist.operador}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turno</p>
                  <Badge variant="outline">Turno {selectedChecklist.turno}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {format(new Date(selectedChecklist.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conformidade</p>
                  <p className="font-semibold font-mono">
                    {selectedChecklist.items.filter((i: any) => i.resposta).length}/{selectedChecklist.items.length} itens
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Itens do Checklist</h3>
                <div className="space-y-2">
                  {selectedChecklist.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${item.resposta ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                        }`}
                    >
                      <span className="text-sm">{item.pergunta}</span>
                      <Badge variant={item.resposta ? 'default' : 'destructive'}>
                        {item.resposta ? 'Conforme' : 'Não Conforme'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedChecklist.observacoes && (
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedChecklist.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Não Conformidade */}
      <Dialog open={!!selectedNaoConformidade} onOpenChange={() => setSelectedNaoConformidade(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-warning" />
              Detalhes da Não Conformidade
            </DialogTitle>
            <DialogDescription>
              Informações completas da não conformidade registrada
            </DialogDescription>
          </DialogHeader>
          {selectedNaoConformidade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold">{selectedNaoConformidade.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turno</p>
                  <Badge variant="outline">Turno {selectedNaoConformidade.turno}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local/Setor</p>
                  <p className="font-semibold">{selectedNaoConformidade.local}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-semibold">{selectedNaoConformidade.operador}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {format(new Date(selectedNaoConformidade.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedNaoConformidade.descricao}</p>
              </div>

              {selectedNaoConformidade.foto && (
                <div>
                  <h3 className="font-semibold mb-2">Foto</h3>
                  <img
                    src={selectedNaoConformidade.foto}
                    alt="Foto da não conformidade"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Ocorrência */}
      <Dialog open={!!selectedOcorrencia} onOpenChange={() => setSelectedOcorrencia(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Detalhes da Ocorrência
            </DialogTitle>
            <DialogDescription>
              Informações completas da ocorrência registrada
            </DialogDescription>
          </DialogHeader>
          {selectedOcorrencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold capitalize">{selectedOcorrencia.tipo.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <Badge variant="outline">{selectedOcorrencia.setor}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turno</p>
                  <Badge variant="outline">Turno {selectedOcorrencia.turno}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-semibold">{selectedOcorrencia.operador}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {format(new Date(selectedOcorrencia.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedOcorrencia.descricao}</p>
              </div>

              {selectedOcorrencia.causa && (
                <div>
                  <h3 className="font-semibold mb-2">Possível Causa</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedOcorrencia.causa}</p>
                </div>
              )}

              {selectedOcorrencia.envolvidos && (
                <div>
                  <h3 className="font-semibold mb-2">Envolvidos</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedOcorrencia.envolvidos}</p>
                </div>
              )}

              {selectedOcorrencia.foto && (
                <div>
                  <h3 className="font-semibold mb-2">Foto</h3>
                  <img
                    src={selectedOcorrencia.foto}
                    alt="Foto da ocorrência"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Supervisao;
