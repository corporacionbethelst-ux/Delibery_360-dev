import { Alert } from '@/types/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  order: <AlertCircle className="h-4 w-4" />,
  delivery: <AlertTriangle className="h-4 w-4" />,
  rider: <Info className="h-4 w-4" />,
  system: <AlertCircle className="h-4 w-4" />,
  financial: <AlertCircle className="h-4 w-4" />,
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const severityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export function AlertItem({ alert, onMarkAsRead, onDismiss }: AlertItemProps) {
  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        alert.isRead ? 'bg-muted/50 opacity-75' : 'bg-white shadow-sm'
      } ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icono */}
          <div className={`mt-0.5 ${
            alert.severity === 'critical' ? 'text-red-600' :
            alert.severity === 'high' ? 'text-orange-600' :
            alert.severity === 'medium' ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {typeIcons[alert.type] || <AlertCircle className="h-5 w-5" />}
          </div>

          {/* Contenido */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              {!alert.isRead && (
                <Badge variant="secondary" className="text-xs">
                  Nueva
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: es })}</span>
              <Badge className={severityColors[alert.severity]} variant="outline">
                {severityLabels[alert.severity]}
              </Badge>
              {alert.entityId && (
                <span className="font-mono">ID: {alert.entityId.slice(0, 8)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          {!alert.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead?.(alert.id)}
              title="Marcar como leída"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss?.(alert.id)}
            title="Descartar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
