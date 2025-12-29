import { supabase } from '@/integrations/supabase/client';
import { 
  getAllPendingChecklists, 
  getAllPendingNaoConformidades, 
  getAllPendingOcorrencias,
  markAsSynced
} from './db';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  checklists: { synced: number; failed: number };
  naoConformidades: { synced: number; failed: number };
  ocorrencias: { synced: number; failed: number };
}

async function syncChecklists(userId: string): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPendingChecklists();
  let synced = 0;
  let failed = 0;

  for (const checklist of pending) {
    try {
      // Don't send the local ID - let Supabase generate UUID
      const { error } = await supabase.from('checklists').insert({
        turno: checklist.turno,
        data: checklist.data,
        items: checklist.items,
        observacoes: checklist.observacoes,
        operador: checklist.operador,
        user_id: userId,
      });

      if (error) {
        console.error('Error syncing checklist:', error);
        failed++;
      } else {
        await markAsSynced('checklists', checklist.id);
        synced++;
      }
    } catch (err) {
      console.error('Error syncing checklist:', err);
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
      // Don't send the local ID - let Supabase generate UUID
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
        console.error('Error syncing não conformidade:', error);
        failed++;
      } else {
        await markAsSynced('naoConformidades', nc.id);
        synced++;
      }
    } catch (err) {
      console.error('Error syncing não conformidade:', err);
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
      // Don't send the local ID - let Supabase generate UUID
      const { error } = await supabase.from('ocorrencias').insert({
        tipo: oc.tipo,
        setor: oc.setor,
        descricao: oc.descricao,
        causa: oc.causa,
        envolvidos: oc.envolvidos,
        foto: oc.foto,
        data: oc.data,
        turno: 1, // Default turno - field not stored locally
        operador: oc.operador,
        user_id: userId,
      });

      if (error) {
        console.error('Error syncing ocorrência:', error);
        failed++;
      } else {
        await markAsSynced('ocorrencias', oc.id);
        synced++;
      }
    } catch (err) {
      console.error('Error syncing ocorrência:', err);
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
