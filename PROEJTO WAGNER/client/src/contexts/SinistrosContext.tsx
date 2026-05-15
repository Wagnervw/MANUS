import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { processosDemo, type Processo, type HistoricoEntry } from '@/lib/data';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'wagner-processos';

// Funções auxiliares para localStorage
function carregarProcessos(): Processo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erro ao carregar processos do localStorage:', error);
  }
  return processosDemo;
}

function salvarProcessos(processos: Processo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
  } catch (error) {
    console.error('Erro ao salvar processos no localStorage:', error);
  }
}

interface ProcessosContextType {
  processos: Processo[];
  addProcesso: (processo: Omit<Processo, 'id' | 'historico'>) => Processo;
  updateStatus: (id: string, status: Processo['status'], operador?: string) => void;
  getProcesso: (id: string) => Processo | undefined;
  duplicarProcesso: (id: string, novoNumero: string) => Processo | null;
  addHistoricoEntry: (id: string, entry: Omit<HistoricoEntry, 'id'>) => void;
}

const ProcessosContext = createContext<ProcessosContextType | undefined>(undefined);

export function ProcessosProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<Processo[]>(() => carregarProcessos());

  // Salvar no localStorage sempre que processos mudam
  useEffect(() => {
    salvarProcessos(processos);
  }, [processos]);

  const addProcesso = useCallback((data: Omit<Processo, 'id' | 'historico'>) => {
    const now = new Date();
    const newProcesso: Processo = {
      ...data,
      id: nanoid(),
      historico: [
        {
          id: nanoid(),
          data: now.toISOString().split('T')[0],
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operador: data.operador,
          acao: 'Processo criado',
          detalhes: `Processo ${data.numero} criado por ${data.operador}`,
        },
      ],
    };
    setProcessos(prev => {
      const updated = [newProcesso, ...prev];
      salvarProcessos(updated);
      return updated;
    });
    return newProcesso;
  }, []);

  const updateStatus = useCallback((id: string, status: Processo['status'], operador?: string) => {
    const now = new Date();
    setProcessos(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const entry: HistoricoEntry = {
          id: nanoid(),
          data: now.toISOString().split('T')[0],
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operador: operador || p.operador,
          acao: 'Status alterado',
          detalhes: `Status alterado de "${p.status}" para "${status}"`,
        };
        return { ...p, status, historico: [...p.historico, entry] };
      });
      salvarProcessos(updated);
      return updated;
    });
  }, []);

  const getProcesso = useCallback((id: string) => {
    return processos.find(p => p.id === id);
  }, [processos]);

  const duplicarProcesso = useCallback((id: string, novoNumero: string) => {
    const original = processos.find(p => p.id === id);
    if (!original) return null;

    const now = new Date();
    const duplicado: Processo = {
      ...original,
      id: nanoid(),
      numero: novoNumero,
      status: 'Em andamento',
      dataAbertura: now.toISOString().split('T')[0],
      historico: [
        {
          id: nanoid(),
          data: now.toISOString().split('T')[0],
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operador: original.operador,
          acao: 'Processo duplicado',
          detalhes: `Duplicado a partir do processo ${original.numero}`,
        },
      ],
    };
    setProcessos(prev => {
      const updated = [duplicado, ...prev];
      salvarProcessos(updated);
      return updated;
    });
    return duplicado;
  }, [processos]);

  const addHistoricoEntry = useCallback((id: string, entry: Omit<HistoricoEntry, 'id'>) => {
    setProcessos(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, historico: [...p.historico, { ...entry, id: nanoid() }] };
      });
      salvarProcessos(updated);
      return updated;
    });
  }, []);

  return (
    <ProcessosContext.Provider value={{ processos, addProcesso, updateStatus, getProcesso, duplicarProcesso, addHistoricoEntry }}>
      {children}
    </ProcessosContext.Provider>
  );
}

export function useProcessos() {
  const context = useContext(ProcessosContext);
  if (!context) throw new Error('useProcessos must be used within ProcessosProvider');
  return context;
}

// Função utilitária para limpar localStorage (útil para reset)
export function limparProcessosStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
}
