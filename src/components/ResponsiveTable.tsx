import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  mobileCardRender?: (item: T, index: number) => ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Nenhum item encontrado',
  keyExtractor,
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          if (mobileCardRender) {
            return (
              <div key={keyExtractor(item)} onClick={() => onRowClick?.(item)}>
                {mobileCardRender(item, index)}
              </div>
            );
          }

          return (
            <Card
              key={keyExtractor(item)}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer active:bg-muted/50'
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4 space-y-3">
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((col) => {
                    const value = col.render
                      ? col.render(item)
                      : (item as any)[col.key];
                    return (
                      <div key={String(col.key)} className="flex justify-between items-start gap-2">
                        <span className="text-sm text-muted-foreground">
                          {col.mobileLabel || col.label}
                        </span>
                        <span className="text-sm font-medium text-right">{value}</span>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'border-b border-border/50 hover:bg-muted/30 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => {
                const value = col.render
                  ? col.render(item)
                  : (item as any)[col.key];
                return (
                  <td key={String(col.key)} className="py-3 px-4 text-sm">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsiveTable;
