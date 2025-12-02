import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAllChecklists, getAllNaoConformidades, getAllOcorrencias } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, ClipboardCheck, FileWarning, AlertTriangle, X, Filter } from 'lucide-react';

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
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Supervisão em Tempo Real
            </h1>
            <p className="text-muted-foreground">
              Acompanhe todas as atividades de segurança e qualidade
            </p>
          </div>
        </div>

        {/* Filtros Avançados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="filtro-turno">Turno</Label>
                <Select value={filtroTurno} onValueChange={setFiltroTurno}>
                  <SelectTrigger id="filtro-turno">
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
                <Label htmlFor="filtro-data-inicio">Data Início</Label>
                <Input
                  id="filtro-data-inicio"
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filtro-data-fim">Data Fim</Label>
                <Input
                  id="filtro-data-fim"
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filtro-setor">Setor/Local</Label>
                <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                  <SelectTrigger id="filtro-setor">
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
                <Label htmlFor="filtro-tipo">Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger id="filtro-tipo">
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
      </div>

      {/* Checklists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Checklists Realizados ({checklistsFiltrados.length})
          </CardTitle>
          <CardDescription>
            Últimos checklists preenchidos pelos operadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checklistsFiltrados.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum checklist encontrado
            </p>
          ) : (
            <div className="space-y-4">
              {checklistsFiltrados.slice(0, 10).map((checklist) => {
                const totalItems = checklist.items.length;
                const conformes = checklist.items.filter((i: any) => i.resposta).length;
                const porcentagem = Math.round((conformes / totalItems) * 100);
                
                return (
                  <div
                    key={checklist.id}
                    onClick={() => setSelectedChecklist(checklist)}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{checklist.operador}</p>
                          <Badge variant="outline">Turno {checklist.turno}</Badge>
                        </div>
                        <Badge variant={porcentagem === 100 ? 'default' : 'secondary'}>
                          {conformes}/{totalItems} ({porcentagem}%)
                        </Badge>
                      </div>
                      {checklist.observacoes && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {checklist.observacoes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(checklist.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Não Conformidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-destructive" />
            Não Conformidades ({naoConformidadesFiltradas.length})
          </CardTitle>
          <CardDescription>
            Registros de situações não conformes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {naoConformidadesFiltradas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma não conformidade encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {naoConformidadesFiltradas.slice(0, 10).map((nc) => (
                <div
                  key={nc.id}
                  onClick={() => setSelectedNaoConformidade(nc)}
                  className="flex items-start gap-4 p-4 border-2 border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors cursor-pointer"
                >
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <FileWarning className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{nc.tipo}</p>
                      <Badge variant="outline">Turno {nc.turno}</Badge>
                    </div>
                    <p className="text-sm mb-1">{nc.descricao}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{nc.local}</span>
                      <span>Por: {nc.operador}</span>
                      <span>
                        {format(new Date(nc.createdAt), "dd/MM/yyyy 'às' HH:mm", {
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

      {/* Ocorrências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Ocorrências ({ocorrenciasFiltradas.length})
          </CardTitle>
          <CardDescription>
            Acidentes, incidentes e quase-acidentes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ocorrenciasFiltradas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma ocorrência encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {ocorrenciasFiltradas.slice(0, 10).map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  onClick={() => setSelectedOcorrencia(ocorrencia)}
                  className="flex items-start gap-4 p-4 border-2 border-accent/20 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                >
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold capitalize">{ocorrencia.tipo.replace('-', ' ')}</p>
                      <Badge variant="outline">{ocorrencia.setor}</Badge>
                    </div>
                    <p className="text-sm mb-1">{ocorrencia.descricao}</p>
                    {ocorrencia.envolvidos && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Envolvidos: {ocorrencia.envolvidos}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Por: {ocorrencia.operador}</span>
                      <span>
                        {format(new Date(ocorrencia.createdAt), "dd/MM/yyyy 'às' HH:mm", {
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
                  <p className="font-semibold">
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
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.resposta ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      <span>{item.pergunta}</span>
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
              <FileWarning className="w-5 h-5 text-destructive" />
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
              <AlertTriangle className="w-5 h-5 text-accent" />
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
