import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, User, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Definicoes = () => {
  const { toast } = useToast();
  const [notificacoes, setNotificacoes] = useState(true);
  const [alertasCriticos, setAlertasCriticos] = useState(true);
  const [somAlertas, setSomAlertas] = useState(false);
  const [idioma, setIdioma] = useState('pt');
  const [atualizacaoAuto, setAtualizacaoAuto] = useState(true);

  const handleSave = () => {
    toast({
      title: "✅ Definições Guardadas",
      description: "As suas preferências foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          Definições
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure as preferências do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>
              Gerir alertas e notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notificacoes">Notificações Ativas</Label>
                <p className="text-xs text-muted-foreground">Receber notificações em tempo real</p>
              </div>
              <Switch
                id="notificacoes"
                checked={notificacoes}
                onCheckedChange={setNotificacoes}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alertas-criticos">Alertas Críticos</Label>
                <p className="text-xs text-muted-foreground">Destacar incidentes de alta prioridade</p>
              </div>
              <Switch
                id="alertas-criticos"
                checked={alertasCriticos}
                onCheckedChange={setAlertasCriticos}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="som-alertas">Som de Alertas</Label>
                <p className="text-xs text-muted-foreground">Reproduzir som em novos alertas</p>
              </div>
              <Switch
                id="som-alertas"
                checked={somAlertas}
                onCheckedChange={setSomAlertas}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Sistema
            </CardTitle>
            <CardDescription>
              Configurações gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idioma">Idioma</Label>
              <Select value={idioma} onValueChange={setIdioma}>
                <SelectTrigger id="idioma">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="atualizacao-auto">Atualização Automática</Label>
                <p className="text-xs text-muted-foreground">Atualizar dados automaticamente</p>
              </div>
              <Switch
                id="atualizacao-auto"
                checked={atualizacaoAuto}
                onCheckedChange={setAtualizacaoAuto}
              />
            </div>
          </CardContent>
        </Card>

        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Perfil
            </CardTitle>
            <CardDescription>
              Informações da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gestão de perfil disponível em breve.
            </p>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-primary" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalizar interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tema escuro ativado por padrão.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Definições
        </Button>
      </div>
    </div>
  );
};

export default Definicoes;
