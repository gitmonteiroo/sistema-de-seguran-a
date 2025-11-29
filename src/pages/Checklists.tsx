import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addChecklist } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';

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
      
      toast.success('Checklist salvo com sucesso!');
      
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Checklist de Segurança</h1>
        <p className="text-muted-foreground">
          Preencha o checklist diário do seu turno
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              Checklist Diário
            </CardTitle>
            <CardDescription>
              Todos os itens devem ser verificados antes de iniciar as atividades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Turno */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Selecione o Turno</Label>
              <RadioGroup
                value={turno}
                onValueChange={(value) => setTurno(value as '1' | '2' | '3')}
                className="flex gap-4"
              >
                {['1', '2', '3'].map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <RadioGroupItem value={t} id={`turno-${t}`} />
                    <Label htmlFor={`turno-${t}`} className="cursor-pointer font-normal">
                      Turno {t}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Itens do Checklist */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Itens de Verificação</Label>
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm flex-1">{item}</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={respostas[index] === true ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleResposta(index, true)}
                            className={
                              respostas[index] === true
                                ? 'bg-success hover:bg-success/90'
                                : ''
                            }
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Sim
                          </Button>
                          <Button
                            type="button"
                            variant={respostas[index] === false ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleResposta(index, false)}
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
