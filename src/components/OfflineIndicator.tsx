import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPendingCount, syncAllData, startAutoSync, stopAutoSync, SyncStatus } from '@/lib/syncService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [showBanner, setShowBanner] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Check pending count periodically
  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  // Start auto-sync when user is authenticated
  useEffect(() => {
    if (user?.id) {
      startAutoSync(user.id, 60000); // Sync every minute
    }
    return () => stopAutoSync();
  }, [user?.id]);

  // Show banner when offline or has pending
  useEffect(() => {
    setShowBanner(!isOnline || pendingCount > 0);
  }, [isOnline, pendingCount]);

  const handleSync = useCallback(async () => {
    if (!user || syncStatus === 'syncing' || syncStatus === 'retrying') return;

    setSyncStatus('syncing');
    setRetryAttempt(0);
    
    try {
      const result = await syncAllData(user.id);
      const totalSynced = result.checklists.synced + result.naoConformidades.synced + result.ocorrencias.synced;
      const totalFailed = result.checklists.failed + result.naoConformidades.failed + result.ocorrencias.failed;

      if (totalSynced > 0) {
        toast.success(`${totalSynced} registro(s) sincronizado(s) com sucesso!`);
      }
      if (totalFailed > 0) {
        toast.error(`${totalFailed} registro(s) falharam ao sincronizar`);
      }

      setSyncStatus(totalFailed > 0 ? 'error' : 'success');
      
      // Refresh pending count
      const newCount = await getPendingCount();
      setPendingCount(newCount);

      // Reset status after a bit
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast.error('Erro ao sincronizar dados. Tentando novamente automaticamente...');
      
      // Auto-retry after error with exponential backoff
      setRetryAttempt(prev => prev + 1);
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 30000);
      
      setTimeout(() => {
        setSyncStatus('idle');
        if (isOnline && pendingCount > 0) {
          handleSync();
        }
      }, delay);
    }
  }, [user, syncStatus, isOnline, pendingCount, retryAttempt]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleSyncNeeded = async () => {
      if (isOnline && user && pendingCount > 0) {
        await handleSync();
      }
    };

    window.addEventListener('app:sync-needed', handleSyncNeeded);
    
    // Also try to sync immediately when online and has pending
    if (isOnline && user && pendingCount > 0 && syncStatus === 'idle') {
      handleSync();
    }

    return () => {
      window.removeEventListener('app:sync-needed', handleSyncNeeded);
    };
  }, [isOnline, user, pendingCount, syncStatus, handleSync]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300',
        'flex items-center justify-center gap-2',
        !isOnline 
          ? 'bg-destructive text-destructive-foreground' 
          : pendingCount > 0 
            ? 'bg-accent text-accent-foreground'
            : 'bg-success text-success-foreground'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Modo Offline - Os dados serão salvos localmente</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          {syncStatus === 'syncing' || syncStatus === 'retrying' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                Sincronizando {pendingCount} registro(s)...
                {retryAttempt > 0 && ` (tentativa ${retryAttempt + 1})`}
              </span>
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4" />
              <span>{pendingCount} registro(s) pendente(s)</span>
              <button
                onClick={handleSync}
                className="ml-2 underline hover:no-underline"
              >
                Sincronizar agora
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Todos os dados sincronizados</span>
        </>
      )}
    </div>
  );
}
