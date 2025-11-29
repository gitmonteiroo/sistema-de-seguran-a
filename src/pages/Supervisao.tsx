import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getAllChecklists, getAllNaoConformidades, getAllOcorrencias } from '@/lib/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, ClipboardCheck, FileWarning, AlertTriangle } from 'lucide-react';

const Supervisao = () => {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [naoConformidades, setNaoConformidades] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');

  useEffect(() => {
    loadData();
    // Reload data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const checklistsFiltrados = filtroTurno === 'todos' 
    ? checklists 
    : checklists.filter(c => c.turno.toString() === filtroTurno);

  const naoConformidadesFiltradas = filtroTurno === 'todos' 
    ? naoConformidades 
    : naoConformidades.filter(nc => nc.turno.toString() === filtroTurno);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Supervisão em Tempo Real
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades de segurança e qualidade
          </p>
        </div>
        <div className="w-48">
          <Select value={filtroTurno} onValueChange={setFiltroTurno}>
            <SelectTrigger>
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
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                  className="flex items-start gap-4 p-4 border-2 border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors"
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
            Ocorrências ({ocorrencias.length})
          </CardTitle>
          <CardDescription>
            Acidentes, incidentes e quase-acidentes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ocorrencias.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma ocorrência encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {ocorrencias.slice(0, 10).map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  className="flex items-start gap-4 p-4 border-2 border-accent/20 rounded-lg hover:bg-accent/5 transition-colors"
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
    </div>
  );
};

export default Supervisao;
