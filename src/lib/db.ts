import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Base interface for syncable records
export interface SyncableRecord {
  id: string;
  synced: boolean;
  createdAt: string;
}

interface SafetyDB extends DBSchema {
  checklists: {
    key: string;
    value: {
      id: string;
      turno: 1 | 2 | 3;
      data: string;
      items: Array<{
        pergunta: string;
        resposta: boolean;
      }>;
      observacoes?: string;
      operador: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string; 'by-turno': number; 'by-synced': number };
  };
  naoConformidades: {
    key: string;
    value: {
      id: string;
      tipo: string;
      descricao: string;
      local: string;
      turno: 1 | 2 | 3;
      foto?: string;
      data: string;
      operador: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string; 'by-synced': number };
  };
  ocorrencias: {
    key: string;
    value: {
      id: string;
      tipo: 'acidente' | 'incidente' | 'quase-acidente';
      setor: string;
      descricao: string;
      causa?: string;
      foto?: string;
      envolvidos?: string;
      data: string;
      hora: string;
      operador: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-date': string; 'by-tipo': string; 'by-synced': number };
  };
}

let db: IDBPDatabase<SafetyDB> | null = null;

export async function initDB() {
  if (db) return db;

  db = await openDB<SafetyDB>('safety-system-db', 2, {
    upgrade(db, oldVersion) {
      // Handle migration from version 1
      if (oldVersion < 2) {
        // Delete old stores if they exist and recreate with new schema
        const storeNames = db.objectStoreNames;
        
        if (storeNames.contains('checklists')) {
          db.deleteObjectStore('checklists');
        }
        if (storeNames.contains('naoConformidades')) {
          db.deleteObjectStore('naoConformidades');
        }
        if (storeNames.contains('ocorrencias')) {
          db.deleteObjectStore('ocorrencias');
        }
      }

      // Checklists store
      const checklistStore = db.createObjectStore('checklists', {
        keyPath: 'id',
      });
      checklistStore.createIndex('by-date', 'data');
      checklistStore.createIndex('by-turno', 'turno');
      checklistStore.createIndex('by-synced', 'synced');

      // Não conformidades store
      const naoConformidadesStore = db.createObjectStore('naoConformidades', {
        keyPath: 'id',
      });
      naoConformidadesStore.createIndex('by-date', 'data');
      naoConformidadesStore.createIndex('by-synced', 'synced');

      // Ocorrências store
      const ocorrenciasStore = db.createObjectStore('ocorrencias', {
        keyPath: 'id',
      });
      ocorrenciasStore.createIndex('by-date', 'data');
      ocorrenciasStore.createIndex('by-tipo', 'tipo');
      ocorrenciasStore.createIndex('by-synced', 'synced');
    },
  });

  return db;
}

// Checklists
export async function addChecklist(checklist: Omit<SafetyDB['checklists']['value'], 'synced'>) {
  const database = await initDB();
  await database.add('checklists', { ...checklist, synced: false });
}

export async function getAllChecklists() {
  const database = await initDB();
  return database.getAll('checklists');
}

export async function getChecklistsByDate(date: string) {
  const database = await initDB();
  return database.getAllFromIndex('checklists', 'by-date', date);
}

export async function getAllPendingChecklists() {
  const database = await initDB();
  const all = await database.getAll('checklists');
  return all.filter(item => !item.synced);
}

// Não Conformidades
export async function addNaoConformidade(naoConformidade: Omit<SafetyDB['naoConformidades']['value'], 'synced'>) {
  const database = await initDB();
  await database.add('naoConformidades', { ...naoConformidade, synced: false });
}

export async function getAllNaoConformidades() {
  const database = await initDB();
  return database.getAll('naoConformidades');
}

export async function getAllPendingNaoConformidades() {
  const database = await initDB();
  const all = await database.getAll('naoConformidades');
  return all.filter(item => !item.synced);
}

// Ocorrências
export async function addOcorrencia(ocorrencia: Omit<SafetyDB['ocorrencias']['value'], 'synced'>) {
  const database = await initDB();
  await database.add('ocorrencias', { ...ocorrencia, synced: false });
}

export async function getAllOcorrencias() {
  const database = await initDB();
  return database.getAll('ocorrencias');
}

export async function getOcorrenciasByTipo(tipo: string) {
  const database = await initDB();
  return database.getAllFromIndex('ocorrencias', 'by-tipo', tipo);
}

export async function getAllPendingOcorrencias() {
  const database = await initDB();
  const all = await database.getAll('ocorrencias');
  return all.filter(item => !item.synced);
}

// Mark as synced
export async function markAsSynced(
  storeName: 'checklists' | 'naoConformidades' | 'ocorrencias',
  id: string
) {
  const database = await initDB();
  const record = await database.get(storeName, id);
  if (record) {
    record.synced = true;
    await database.put(storeName, record);
  }
}

// Get pending count
export async function getPendingCount(): Promise<number> {
  const [checklists, naoConformidades, ocorrencias] = await Promise.all([
    getAllPendingChecklists(),
    getAllPendingNaoConformidades(),
    getAllPendingOcorrencias(),
  ]);
  return checklists.length + naoConformidades.length + ocorrencias.length;
}
