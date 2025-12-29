import { supabase } from '@/integrations/supabase/client';
import { 
  getAllPendingChecklists, 
  getAllPendingNaoConformidades, 
  getAllPendingOcorrencias,
  markAsSynced
} from './db';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'retrying';

export interface SyncResult {
  checklists: { synced: number; failed: number };
  naoConformidades: { synced: number; failed: number };
  ocorrencias: { synced: number; failed: number };
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Calculate exponential backoff delay
function getBackoffDelay(attempt: number): number {
  const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, MAX_DELAY_MS);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is retryable (network errors, timeouts, server errors)
function isRetryableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  
  // Network errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('Failed to fetch')) {
    return true;
  }
  
  // Server errors (5xx)
  if (error.code?.startsWith('5') || error.message?.includes('500')) {
    return true;
  }
  
  // Rate limiting
  if (error.code === '429' || error.message?.includes('rate limit')) {
    return true;
  }
  
  return false;
}

// Generic retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;
      
      if (attempt < MAX_RETRIES) {
        const delay = getBackoffDelay(attempt);
        console.log(`[Sync] ${operationName} failed, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

async function syncChecklists(userId: string): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPendingChecklists();
  let synced = 0;
  let failed = 0;

  for (const checklist of pending) {
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('checklists').insert({
          turno: checklist.turno,
          data: checklist.data,
          items: checklist.items,
          observacoes: checklist.observacoes,
          operador: checklist.operador,
          user_id: userId,
        });

        if (error) {
          if (isRetryableError(error)) {
            throw error;
          }
          console.error('Error syncing checklist:', error);
          failed++;
          return;
        }
        
        await markAsSynced('checklists', checklist.id);
        synced++;
      }, `Checklist ${checklist.id}`);
    } catch (err) {
      console.error('Error syncing checklist after retries:', err);
      failed++;
    }
  }

  return { synced, failed };
}

async function syncNaoConformidades(userId: string): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPendingNaoConformidades();
  let synced = 0;
  let failed = 0;

  for (const nc of pending) {
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('nao_conformidades').insert({
          tipo: nc.tipo,
          descricao: nc.descricao,
          local: nc.local,
          turno: nc.turno,
          foto: nc.foto,
          data: nc.data,
          operador: nc.operador,
          user_id: userId,
        });

        if (error) {
          if (isRetryableError(error)) {
            throw error;
          }
          console.error('Error syncing não conformidade:', error);
          failed++;
          return;
        }
        
        await markAsSynced('naoConformidades', nc.id);
        synced++;
      }, `NaoConformidade ${nc.id}`);
    } catch (err) {
      console.error('Error syncing não conformidade after retries:', err);
      failed++;
    }
  }

  return { synced, failed };
}

async function syncOcorrencias(userId: string): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPendingOcorrencias();
  let synced = 0;
  let failed = 0;

  for (const oc of pending) {
    try {
      await withRetry(async () => {
        // Handle legacy records that don't have turno field
        const turno = (oc as any).turno ?? 1;
        
        const { error } = await supabase.from('ocorrencias').insert({
          tipo: oc.tipo,
          turno: turno,
          setor: oc.setor,
          descricao: oc.descricao,
          causa: oc.causa,
          envolvidos: oc.envolvidos,
          foto: oc.foto,
          data: oc.data,
          operador: oc.operador,
          user_id: userId,
        });

        if (error) {
          if (isRetryableError(error)) {
            throw error;
          }
          console.error('Error syncing ocorrência:', error);
          failed++;
          return;
        }
        
        await markAsSynced('ocorrencias', oc.id);
        synced++;
      }, `Ocorrencia ${oc.id}`);
    } catch (err) {
      console.error('Error syncing ocorrência after retries:', err);
      failed++;
    }
  }

  return { synced, failed };
}

export async function syncAllData(userId: string): Promise<SyncResult> {
  const [checklists, naoConformidades, ocorrencias] = await Promise.all([
    syncChecklists(userId),
    syncNaoConformidades(userId),
    syncOcorrencias(userId),
  ]);

  return { checklists, naoConformidades, ocorrencias };
}

export async function getPendingCount(): Promise<number> {
  const [checklists, naoConformidades, ocorrencias] = await Promise.all([
    getAllPendingChecklists(),
    getAllPendingNaoConformidades(),
    getAllPendingOcorrencias(),
  ]);

  return checklists.length + naoConformidades.length + ocorrencias.length;
}

// Auto-sync manager for background synchronization
let syncInterval: ReturnType<typeof setInterval> | null = null;
let isAutoSyncing = false;

export function startAutoSync(userId: string, intervalMs = 60000): void {
  if (syncInterval) return;
  
  syncInterval = setInterval(async () => {
    if (isAutoSyncing || !navigator.onLine) return;
    
    const pending = await getPendingCount();
    if (pending > 0) {
      isAutoSyncing = true;
      try {
        console.log(`[AutoSync] Starting sync of ${pending} pending items...`);
        await syncAllData(userId);
        console.log('[AutoSync] Sync completed');
      } catch (err) {
        console.error('[AutoSync] Sync failed:', err);
      } finally {
        isAutoSyncing = false;
      }
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
