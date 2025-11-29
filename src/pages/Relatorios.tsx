import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllChecklists, getAllNaoConformidades, getAllOcorrencias } from '@/lib/db';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('checklists');
  const [checklists, setChecklists] = useState<any[]>([]);
  const [naoConformidades, setNaoConformidades] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setChecklists(await getAllChecklists());
    setNaoConformidades(await getAllNaoConformidades());
    setOcorrencias(await getAllOcorrencias());
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    doc.setFontSize(18);
    doc.text('Sistema de Segurança Industrial', 14, 20);
    doc.setFontSize(12);
    doc.text(`Relatório de ${tipoRelatorio === 'checklists' ? 'Checklists' : tipoRelatorio === 'naoConformidades' ? 'Não Conformidades' : 'Ocorrências'}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${now}`, 14, 38);

    let y = 50;
    let data: any[] = [];

    if (tipoRelatorio === 'checklists') {
      data = checklists;
      doc.setFontSize(11);
      data.slice(0, 20).forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const conformes = item.items.filter((i: any) => i.resposta).length;
        const total = item.items.length;
        doc.text(`${index + 1}. Turno ${item.turno} - ${item.operador} - ${conformes}/${total} - ${format(new Date(item.createdAt), 'dd/MM/yyyy')}`, 14, y);
        y += 8;
      });
    } else if (tipoRelatorio === 'naoConformidades') {
      data = naoConformidades;
      doc.setFontSize(11);
      data.slice(0, 20).forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${item.tipo} - ${item.local} - Turno ${item.turno}`, 14, y);
        y += 6;
        doc.setFontSize(9);
        const desc = item.descricao.length > 80 ? item.descricao.substring(0, 80) + '...' : item.descricao;
        doc.text(desc, 14, y);
        y += 10;
        doc.setFontSize(11);
      });
    } else {
      data = ocorrencias;
      doc.setFontSize(11);
      data.slice(0, 20).forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${item.tipo.toUpperCase()} - ${item.setor}`, 14, y);
        y += 6;
        doc.setFontSize(9);
        const desc = item.descricao.length > 80 ? item.descricao.substring(0, 80) + '...' : item.descricao;
        doc.text(desc, 14, y);
        y += 10;
        doc.setFontSize(11);
      });
    }

    doc.save(`relatorio-${tipoRelatorio}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  const gerarExcel = () => {
    let data: any[] = [];
    let filename = '';

    if (tipoRelatorio === 'checklists') {
      data = checklists.map((item) => ({
        Data: format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        Turno: item.turno,
        Operador: item.operador,
        Total: item.items.length,
        Conformes: item.items.filter((i: any) => i.resposta).length,
        Observações: item.observacoes || '-',
      }));
      filename = 'checklists';
    } else if (tipoRelatorio === 'naoConformidades') {
      data = naoConformidades.map((item) => ({
        Data: format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        Tipo: item.tipo,
        Local: item.local,
        Turno: item.turno,
        Descrição: item.descricao,
        Operador: item.operador,
      }));
      filename = 'nao-conformidades';
    } else {
      data = ocorrencias.map((item) => ({
        Data: format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        Tipo: item.tipo,
        Setor: item.setor,
        Descrição: item.descricao,
        Causa: item.causa || '-',
        Envolvidos: item.envolvidos || '-',
        Operador: item.operador,
      }));
      filename = 'ocorrencias';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio-${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel gerado com sucesso!');
  };

  const getResumo = () => {
    if (tipoRelatorio === 'checklists') {
      return {
        total: checklists.length,
        descricao: 'checklists realizados',
      };
    } else if (tipoRelatorio === 'naoConformidades') {
      return {
        total: naoConformidades.length,
        descricao: 'não conformidades registradas',
      };
    } else {
      return {
        total: ocorrencias.length,
        descricao: 'ocorrências registradas',
      };
    }
  };

  const resumo = getResumo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere relatórios em PDF ou Excel dos registros do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Gerador de Relatórios
          </CardTitle>
          <CardDescription>
            Selecione o tipo de relatório e o formato de exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checklists">Checklists por Turno</SelectItem>
                <SelectItem value="naoConformidades">Não Conformidades</SelectItem>
                <SelectItem value="ocorrencias">Ocorrências</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{resumo.total}</p>
                <p className="text-muted-foreground">{resumo.descricao}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              className="w-full h-16"
              onClick={gerarPDF}
              disabled={resumo.total === 0}
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar para PDF
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16"
              onClick={gerarExcel}
              disabled={resumo.total === 0}
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar para Excel
            </Button>
          </div>

          {resumo.total === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Não há dados disponíveis para este tipo de relatório
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
