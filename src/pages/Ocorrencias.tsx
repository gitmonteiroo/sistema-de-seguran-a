import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addOcorrencia } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertTriangle, Camera } from 'lucide-react';

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
      
      toast.success('Ocorrência registrada com sucesso!');
      
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Ocorrências</h1>
        <p className="text-muted-foreground">
          Registre acidentes, incidentes e quase-acidentes
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-accent" />
              Registro de Ocorrência
            </CardTitle>
            <CardDescription>
              Documente eventos relacionados à segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Ocorrência *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger id="tipo" className="h-12">
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
              <Label htmlFor="setor">Setor *</Label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger id="setor" className="h-12">
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
              <Label htmlFor="descricao">Descrição do Ocorrido *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="causa">Possível Causa (opcional)</Label>
              <Textarea
                id="causa"
                placeholder="Descreva a possível causa da ocorrência..."
                value={causa}
                onChange={(e) => setCausa(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envolvidos">Envolvidos (opcional)</Label>
              <Input
                id="envolvidos"
                placeholder="Nome dos envolvidos (separados por vírgula)"
                value={envolvidos}
                onChange={(e) => setEnvolvidos(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto-ocorrencia">Foto (opcional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="foto-ocorrencia"
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="h-12"
                />
                <Camera className="w-6 h-6 text-muted-foreground" />
              </div>
              {foto && (
                <div className="mt-4">
                  <img
                    src={foto}
                    alt="Preview"
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90"
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
