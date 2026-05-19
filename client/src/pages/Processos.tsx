// Processos — Wagner Reguladora - Finalização Central
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { useProcessos } from '@/contexts/SinistrosContext';
import { getStatusColor, STATUS_PROCESSO, CAUSAS_EVENTO, MEMBROS_CELULA } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MoveVertical as MoreVertical, Eye, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ProcessosTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Numero</TableHead>
                <TableHead>Segurado</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Causa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Processos() {
  const { processos, loading, updateStatus } = useProcessos();
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebouncedValue(busca, 300);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCausa, setFiltroCausa] = useState('todos');
  const [filtroOperador, setFiltroOperador] = useState('todos');

  const filtrados = useMemo(() => {
    const termo = buscaDebounced.toLowerCase();
    return processos.filter(p => {
      const matchBusca = !termo ||
        p.numero.toLowerCase().includes(termo) ||
        p.operador.toLowerCase().includes(termo) ||
        p.causaEvento.toLowerCase().includes(termo) ||
        (p.segurado || '').toLowerCase().includes(termo) ||
        (p.seguradora || '').toLowerCase().includes(termo);
      const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;
      const matchCausa = filtroCausa === 'todos' || p.causaEvento === filtroCausa;
      const matchOperador = filtroOperador === 'todos' || p.operador === filtroOperador;
      return matchBusca && matchStatus && matchCausa && matchOperador;
    });
  }, [processos, buscaDebounced, filtroStatus, filtroCausa, filtroOperador]);

  const handleStatusChange = (id: string, newStatus: typeof STATUS_PROCESSO[number]) => {
    updateStatus(id, newStatus);
    toast.success(`Status atualizado para "${newStatus}"`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtrados.length} registro(s) encontrado(s)</p>
        </div>
        <Link href="/controle">
          <Button className="gap-1.5">
            <Plus className="w-4 h-4" /> Novo Processo
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, segurado, seguradora, operador..."
                className="pl-9"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  {STATUS_PROCESSO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroCausa} onValueChange={setFiltroCausa}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Causa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Causas</SelectItem>
                  {CAUSAS_EVENTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroOperador} onValueChange={setFiltroOperador}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Operadores</SelectItem>
                  {MEMBROS_CELULA.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? <ProcessosTableSkeleton /> :
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Número</TableHead>
                  <TableHead>Segurado</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Causa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhum processo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map(p => (
                    <TableRow key={p.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <Link href={`/processo/${p.id}`}>
                          <span className="text-sm font-mono font-medium text-primary hover:underline cursor-pointer">{p.numero}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{p.segurado || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground text-xs">{p.seguradora || '—'}</TableCell>
                      <TableCell className="text-sm text-foreground">{p.operador}</TableCell>
                      <TableCell className="text-sm text-foreground">{p.causaEvento}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] font-medium ${getStatusColor(p.status)}`}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.dataAbertura).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <Link href={`/processo/${p.id}`}>
                              <DropdownMenuItem className="gap-2">
                                <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Alterar Status</DropdownMenuLabel>
                            {STATUS_PROCESSO.filter(s => s !== p.status).map(s => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(p.id, s)} className="gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      }
    </div>
  );
}
