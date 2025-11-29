import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
    };
    indexes: { 'by-date': string; 'by-turno': number };
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
    };
    indexes: { 'by-date': string };
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
    };
    indexes: { 'by-date': string; 'by-tipo': string };
  };
}

let db: IDBPDatabase<SafetyDB> | null = null;

export async function initDB() {
  if (db) return db;

  db = await openDB<SafetyDB>('safety-system-db', 1, {
    upgrade(db) {
      // Checklists store
      const checklistStore = db.createObjectStore('checklists', {
        keyPath: 'id',
      });
      checklistStore.createIndex('by-date', 'data');
      checklistStore.createIndex('by-turno', 'turno');

      // Não conformidades store
      const naoConformidadesStore = db.createObjectStore('naoConformidades', {
        keyPath: 'id',
      });
      naoConformidadesStore.createIndex('by-date', 'data');

      // Ocorrências store
      const ocorrenciasStore = db.createObjectStore('ocorrencias', {
        keyPath: 'id',
      });
      ocorrenciasStore.createIndex('by-date', 'data');
      ocorrenciasStore.createIndex('by-tipo', 'tipo');
    },
  });

  return db;
}

// Checklists
export async function addChecklist(checklist: SafetyDB['checklists']['value']) {
  const database = await initDB();
  await database.add('checklists', checklist);
}

export async function getAllChecklists() {
  const database = await initDB();
  return database.getAll('checklists');
}

export async function getChecklistsByDate(date: string) {
  const database = await initDB();
  return database.getAllFromIndex('checklists', 'by-date', date);
}

// Não Conformidades
export async function addNaoConformidade(naoConformidade: SafetyDB['naoConformidades']['value']) {
  const database = await initDB();
  await database.add('naoConformidades', naoConformidade);
}

export async function getAllNaoConformidades() {
  const database = await initDB();
  return database.getAll('naoConformidades');
}

// Ocorrências
export async function addOcorrencia(ocorrencia: SafetyDB['ocorrencias']['value']) {
  const database = await initDB();
  await database.add('ocorrencias', ocorrencia);
}

export async function getAllOcorrencias() {
  const database = await initDB();
  return database.getAll('ocorrencias');
}

export async function getOcorrenciasByTipo(tipo: string) {
  const database = await initDB();
  return database.getAllFromIndex('ocorrencias', 'by-tipo', tipo);
}
