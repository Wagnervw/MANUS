import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Processo, type HistoricoEntry } from '@/lib/data';
import {
  fetchProcessos,
  insertProcesso,
  updateProcessoStatus,
  updateProcessoData,
  duplicateProcesso,
  insertHistoricoEntry,
} from '@/lib/processos-api';
import { nanoid } from 'nanoid';

const PROCESSOS_KEY = ['processos'] as const;

interface ProcessosContextType {
  processos: Processo[];
  loading: boolean;
  addProcesso: (processo: Omit<Processo, 'id' | 'historico'>) => Promise<Processo>;
  updateStatus: (id: string, status: Processo['status'], operador?: string) => Promise<void>;
  updateProcesso: (id: string, data: Partial<Omit<Processo, 'id' | 'historico'>>) => Promise<void>;
  getProcesso: (id: string) => Processo | undefined;
  duplicarProcesso: (id: string, novoNumero: string) => Promise<Processo | null>;
  addHistoricoEntry: (id: string, entry: Omit<HistoricoEntry, 'id'>) => Promise<void>;
}

const ProcessosContext = createContext<ProcessosContextType | undefined>(undefined);

export function ProcessosProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: processos = [], isLoading: loading } = useQuery({
    queryKey: PROCESSOS_KEY,
    queryFn: fetchProcessos,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Processo, 'id' | 'historico'>) => {
      const now = new Date();
      const id = nanoid();
      const histEntry: HistoricoEntry = {
        id: nanoid(),
        data: now.toISOString().split('T')[0],
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        operador: data.operador,
        acao: 'Processo criado',
        detalhes: `Processo ${data.numero} criado por ${data.operador}`,
      };
      return insertProcesso(data, id, histEntry);
    },
    onSuccess: (newProcesso) => {
      queryClient.setQueryData<Processo[]>(PROCESSOS_KEY, (old = []) => [newProcesso, ...old]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, operador }: { id: string; status: Processo['status']; operador?: string }) => {
      const processo = processos.find(p => p.id === id);
      if (!processo) throw new Error('Processo not found');
      const now = new Date();
      const entry: HistoricoEntry = {
        id: nanoid(),
        data: now.toISOString().split('T')[0],
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        operador: operador || processo.operador,
        acao: 'Status alterado',
        detalhes: `Status alterado de "${processo.status}" para "${status}"`,
      };
      await updateProcessoStatus(id, status, entry);
      return { id, status, entry };
    },
    onSuccess: ({ id, status, entry }) => {
      queryClient.setQueryData<Processo[]>(PROCESSOS_KEY, (old = []) =>
        old.map(p => p.id === id ? { ...p, status, historico: [...p.historico, entry] } : p)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Processo, 'id' | 'historico'>> }) => {
      const processo = processos.find(p => p.id === id);
      if (!processo) throw new Error('Processo not found');
      await updateProcessoData(id, data, processo);
      return { id, data };
    },
    onSuccess: ({ id, data }) => {
      queryClient.setQueryData<Processo[]>(PROCESSOS_KEY, (old = []) =>
        old.map(p => p.id === id ? { ...p, ...data } : p)
      );
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async ({ id, novoNumero }: { id: string; novoNumero: string }) => {
      const original = processos.find(p => p.id === id);
      if (!original) return null;
      const now = new Date();
      const newId = nanoid();
      const histEntry: HistoricoEntry = {
        id: nanoid(),
        data: now.toISOString().split('T')[0],
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        operador: original.operador,
        acao: 'Processo duplicado',
        detalhes: `Duplicado a partir do processo ${original.numero}`,
      };
      return duplicateProcesso(original, newId, novoNumero, histEntry);
    },
    onSuccess: (duplicado) => {
      if (duplicado) {
        queryClient.setQueryData<Processo[]>(PROCESSOS_KEY, (old = []) => [duplicado, ...old]);
      }
    },
  });

  const historicoMutation = useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: Omit<HistoricoEntry, 'id'> }) => {
      const entryId = nanoid();
      const fullEntry: HistoricoEntry = { ...entry, id: entryId };
      await insertHistoricoEntry(id, fullEntry);
      return { id, entry: fullEntry };
    },
    onSuccess: ({ id, entry }) => {
      queryClient.setQueryData<Processo[]>(PROCESSOS_KEY, (old = []) =>
        old.map(p => p.id === id ? { ...p, historico: [...p.historico, entry] } : p)
      );
    },
  });

  const addProcesso = useCallback(async (data: Omit<Processo, 'id' | 'historico'>) => {
    return addMutation.mutateAsync(data);
  }, [addMutation]);

  const updateStatusFn = useCallback(async (id: string, status: Processo['status'], operador?: string) => {
    await statusMutation.mutateAsync({ id, status, operador });
  }, [statusMutation]);

  const updateProcessoFn = useCallback(async (id: string, data: Partial<Omit<Processo, 'id' | 'historico'>>) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const getProcesso = useCallback((id: string) => {
    return processos.find(p => p.id === id);
  }, [processos]);

  const duplicarProcessoFn = useCallback(async (id: string, novoNumero: string) => {
    return (await duplicarMutation.mutateAsync({ id, novoNumero })) ?? null;
  }, [duplicarMutation]);

  const addHistoricoEntryFn = useCallback(async (id: string, entry: Omit<HistoricoEntry, 'id'>) => {
    await historicoMutation.mutateAsync({ id, entry });
  }, [historicoMutation]);

  return (
    <ProcessosContext.Provider value={{
      processos,
      loading,
      addProcesso,
      updateStatus: updateStatusFn,
      updateProcesso: updateProcessoFn,
      getProcesso,
      duplicarProcesso: duplicarProcessoFn,
      addHistoricoEntry: addHistoricoEntryFn,
    }}>
      {children}
    </ProcessosContext.Provider>
  );
}

export function useProcessos() {
  const context = useContext(ProcessosContext);
  if (!context) throw new Error('useProcessos must be used within ProcessosProvider');
  return context;
}
