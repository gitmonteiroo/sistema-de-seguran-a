import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addOcorrencia } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, Camera, WifiOff } from 'lucide-react';

const tiposOcorrencia = [
  { value: 'acidente', label: 'Acidente', color: 'text-destructive' },
  { value: 'incidente', label: 'Incidente', color: 'text-accent' },
  { value: 'quase-acidente', label: 'Quase-Acidente', color: 'text-yellow-600' },
];

const setores = [
  'Produção',
  'Almoxarifado',
  'Manutenção',
  'Expedição',
  'Recebimento',
  'Administrativo',
  'Refeitório',
  'Outro',
];

const Ocorrencias = () => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [tipo, setTipo] = useState<'acidente' | 'incidente' | 'quase-acidente'>('incidente');
  const [setor, setSetor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [causa, setCausa] = useState('');
  const [envolvidos, setEnvolvidos] = useState('');
  const [foto, setFoto] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!setor || !descricao) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const ocorrencia = {
        id: `ocorrencia-${Date.now()}`,
        tipo,
        setor,
        descricao: descricao.trim(),
        causa: causa.trim() || undefined,
        envolvidos: envolvidos.trim() || undefined,
        foto,
        data: format(now, 'yyyy-MM-dd'),
        hora: format(now, 'HH:mm'),
        operador: user?.name || 'Desconhecido',
        createdAt: now.toISOString(),
      };

      await addOcorrencia(ocorrencia);
      
      if (isOnline) {
        toast.success('Ocorrência registrada e sincronizada!');
      } else {
        toast.success('Ocorrência salva localmente. Será sincronizada quando online.');
      }
      
      // Reset form
      setSetor('');
      setDescricao('');
      setCausa('');
      setEnvolvidos('');
      setFoto(undefined);
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      toast.error('Erro ao registrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Ocorrências</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Registre acidentes, incidentes e quase-acidentes
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              Registro de Ocorrência
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Documente eventos relacionados à segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 md:space-y-6 p-4 pt-0 md:p-6 md:pt-0">
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm">Tipo de Ocorrência *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposOcorrencia.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className={t.color}>{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setor" className="text-sm">Setor *</Label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger id="setor">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-sm">Descrição do Ocorrido *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="min-h-[120px] text-base md:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="causa" className="text-sm">Possível Causa (opcional)</Label>
              <Textarea
                id="causa"
                placeholder="Descreva a possível causa da ocorrência..."
                value={causa}
                onChange={(e) => setCausa(e.target.value)}
                rows={3}
                className="min-h-[100px] text-base md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envolvidos" className="text-sm">Envolvidos (opcional)</Label>
              <Input
                id="envolvidos"
                placeholder="Nome dos envolvidos (separados por vírgula)"
                value={envolvidos}
                onChange={(e) => setEnvolvidos(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto-ocorrencia" className="text-sm">Foto (opcional)</Label>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="relative flex-1">
                  <Input
                    id="foto-ocorrencia"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotoChange}
                    className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Camera className="w-5 h-5" />
                  <span className="text-xs md:hidden">Tirar foto ou selecionar</span>
                </div>
              </div>
              {foto && (
                <div className="mt-3">
                  <img
                    src={foto}
                    alt="Preview"
                    className="max-w-full md:max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 min-h-[52px] text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Ocorrência'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Ocorrencias;
