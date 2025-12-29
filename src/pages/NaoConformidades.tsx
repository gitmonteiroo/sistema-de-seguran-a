import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addNaoConformidade } from '@/lib/db';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileWarning, Camera, WifiOff } from 'lucide-react';

const tiposNaoConformidade = [
  'Equipamento danificado',
  'Falta de EPI',
  'Área desorganizada',
  'Sinalização inadequada',
  'Vazamento',
  'Iluminação deficiente',
  'Outro',
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

const NaoConformidades = () => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [turno, setTurno] = useState('1');
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
      if (!tipo || !descricao || !local) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        setIsSubmitting(false);
        return;
      }

      const naoConformidade = {
        id: `nc-${Date.now()}`,
        tipo,
        descricao: descricao.trim(),
        local,
        turno: parseInt(turno) as 1 | 2 | 3,
        foto,
        data: format(new Date(), 'yyyy-MM-dd'),
        operador: user?.name || 'Desconhecido',
        createdAt: new Date().toISOString(),
      };

      await addNaoConformidade(naoConformidade);
      
      if (isOnline) {
        toast.success('Não conformidade registrada e sincronizada!');
      } else {
        toast.success('Não conformidade salva localmente. Será sincronizada quando online.');
      }
      
      // Reset form
      setTipo('');
      setDescricao('');
      setLocal('');
      setTurno('1');
      setFoto(undefined);
    } catch (error) {
      console.error('Erro ao registrar não conformidade:', error);
      toast.error('Erro ao registrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Não Conformidades</h1>
        <p className="text-muted-foreground">
          Registre situações que não estão de acordo com os padrões
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="w-6 h-6 text-destructive" />
              Registro de Não Conformidade
            </CardTitle>
            <CardDescription>
              Documente desvios de qualidade e segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Não Conformidade *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNaoConformidade.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local/Setor *</Label>
                <Select value={local} onValueChange={setLocal}>
                  <SelectTrigger id="local" className="h-12">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="turno">Turno *</Label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger id="turno" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Turno 1</SelectItem>
                  <SelectItem value="2">Turno 2</SelectItem>
                  <SelectItem value="3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente a não conformidade identificada..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foto">Foto (opcional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="foto"
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
              className="w-full bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Não Conformidade'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NaoConformidades;
