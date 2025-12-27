import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertRecord {
  id: string;
  zone: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  status: 'active' | 'resolved' | 'pending';
}

interface AlertsTableProps {
  alerts: AlertRecord[];
  onResolve: (id: string) => void;
  title?: string;
  description?: string;
}

const AlertsTable = ({
  alerts,
  onResolve,
  title = 'Registos Recentes',
  description = 'Alertas e incidentes do sistema',
}: AlertsTableProps) => {
  const getSeverityBadge = (severity: AlertRecord['severity']) => {
    const styles = {
      critical: 'bg-destructive/20 text-destructive border-destructive/30 shadow-glow-danger',
      warning: 'bg-warning/20 text-warning border-warning/30',
      info: 'bg-info/20 text-info border-info/30',
    };

    const icons = {
      critical: <XCircle className="w-3 h-3 mr-1" />,
      warning: <AlertTriangle className="w-3 h-3 mr-1" />,
      info: <Clock className="w-3 h-3 mr-1" />,
    };

    const labels = {
      critical: 'Crítico',
      warning: 'Aviso',
      info: 'Info',
    };

    return (
      <Badge variant="outline" className={cn('flex items-center w-fit', styles[severity])}>
        {icons[severity]}
        {labels[severity]}
      </Badge>
    );
  };

  const getStatusBadge = (status: AlertRecord['status']) => {
    const styles = {
      active: 'bg-destructive/20 text-destructive border-destructive/30',
      resolved: 'bg-success/20 text-success border-success/30',
      pending: 'bg-warning/20 text-warning border-warning/30',
    };

    const icons = {
      active: <XCircle className="w-3 h-3 mr-1" />,
      resolved: <CheckCircle className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />,
    };

    const labels = {
      active: 'Ativo',
      resolved: 'Resolvido',
      pending: 'Pendente',
    };

    return (
      <Badge variant="outline" className={cn('flex items-center w-fit', styles[status])}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zona</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gravidade</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum alerta registado
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={cn(
                      'transition-colors',
                      alert.severity === 'critical' && alert.status === 'active' && 'bg-destructive/5'
                    )}
                  >
                    <TableCell className="font-mono text-sm">{alert.id}</TableCell>
                    <TableCell className="font-medium">{alert.zone}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.type}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      {alert.status !== 'resolved' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResolve(alert.id)}
                          className="h-7 text-xs bg-success/10 text-success border-success/30 hover:bg-success/20"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolver
                        </Button>
                      ) : (
                        <span className="text-xs text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resolvido
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsTable;
