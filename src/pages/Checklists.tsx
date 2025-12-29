import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addChecklist } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, ClipboardCheck, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const checklistItems = [
  'Trava-rodas posicionados corretamente?',
  'Cones e barreiras de segurança visíveis?',
  'Extintores de incêndio acessíveis e dentro da validade?',
  'Escadas em bom estado de conservação?',
  'Equipamentos de proteção individual (EPIs) disponíveis?',
  'Iluminação adequada no setor?',
  'Pisos livres de obstáculos e vazamentos?',
  'Sinalização de emergência funcionando?',
  'Ferramentas em bom estado?',
  'Área de trabalho organizada e limpa?',
];

const Checklists = () => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [turno, setTurno] = useState<'1' | '2' | '3'>('1');
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResposta = (index: number, valor: boolean) => {
    setRespostas((prev) => ({ ...prev, [index]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const todasRespondidas = checklistItems.every((_, index) => respostas[index] !== undefined);
      
      if (!todasRespondidas) {
        toast.error('Por favor, responda todos os itens do checklist');
        setIsSubmitting(false);
        return;
      }

      const checklist = {
        id: `checklist-${Date.now()}`,
        turno: parseInt(turno) as 1 | 2 | 3,
        data: format(new Date(), 'yyyy-MM-dd'),
        items: checklistItems.map((pergunta, index) => ({
          pergunta,
          resposta: respostas[index],
        })),
        observacoes: observacoes.trim() || undefined,
        operador: user?.name || 'Desconhecido',
        createdAt: new Date().toISOString(),
      };

      await addChecklist(checklist);
      
      if (isOnline) {
        toast.success('Checklist salvo e sincronizado!');
      } else {
        toast.success('Checklist salvo localmente. Será sincronizado quando online.');
      }
      
      // Reset form
      setRespostas({});
      setObservacoes('');
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      toast.error('Erro ao salvar checklist. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Checklist de Segurança</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Preencha o checklist diário do seu turno
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              Checklist Diário
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Todos os itens devem ser verificados antes de iniciar as atividades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 md:space-y-6 p-4 pt-0 md:p-6 md:pt-0">
            {/* Seleção de Turno */}
            <div className="space-y-3">
              <Label className="text-sm md:text-base font-semibold">Selecione o Turno</Label>
              <RadioGroup
                value={turno}
                onValueChange={(value) => setTurno(value as '1' | '2' | '3')}
                className="flex gap-4 md:gap-6"
              >
                {['1', '2', '3'].map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <RadioGroupItem value={t} id={`turno-${t}`} className="h-5 w-5 md:h-4 md:w-4" />
                    <Label htmlFor={`turno-${t}`} className="cursor-pointer font-normal text-sm md:text-base">
                      Turno {t}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Itens do Checklist */}
            <div className="space-y-3 md:space-y-4">
              <Label className="text-sm md:text-base font-semibold">Itens de Verificação</Label>
              <div className="space-y-2 md:space-y-3">
                {checklistItems.map((item, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-3 md:pt-4 md:p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                        <p className="text-sm flex-1">{item}</p>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button
                            type="button"
                            variant={respostas[index] === true ? 'default' : 'outline'}
                            size="default"
                            onClick={() => handleResposta(index, true)}
                            className={cn(
                              'flex-1 md:flex-none min-h-[44px]',
                              respostas[index] === true
                                ? 'bg-success hover:bg-success/90'
                                : ''
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Sim
                          </Button>
                          <Button
                            type="button"
                            variant={respostas[index] === false ? 'destructive' : 'outline'}
                            size="default"
                            onClick={() => handleResposta(index, false)}
                            className="flex-1 md:flex-none min-h-[44px]"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Não
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações relevantes sobre o checklist..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Checklist'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Checklists;
