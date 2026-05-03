// src/components/registrasi/DataTerdaftar.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, RefreshCw, Eye, Pencil, UserCheck,
  Users, ClipboardList, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTerdaftarProps {
  state: any;
  handlers: any;
}

/* ─── Status Badge helper ────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    'Approved':   'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Selesai':    'bg-blue-100    text-blue-700    border-blue-200',
    'On Progress':'bg-sky-100     text-sky-700     border-sky-200',
    'Review':     'bg-amber-100   text-amber-700   border-amber-200',
    'Ditolak':    'bg-rose-100    text-rose-700    border-rose-200',
    'Rejected':   'bg-rose-100    text-rose-700    border-rose-200',
  };
  const cls = map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', cls)}>
      {status || 'New Task'}
    </span>
  );
};

/* ─── Reusable Panel ─────────────────────────────────────────── */
const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

/* ─── Komponen Utama ──────────────────────────────────────────── */
export const DataTerdaftar: React.FC<DataTerdaftarProps> = ({ state, handlers }) => {
  return (
    <Tabs defaultValue="list_klien" className="w-full">

      {/* ── Tab Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="list_klien"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white"
          >
            <Users className="w-3.5 h-3.5" />
            Data Klien
          </TabsTrigger>
          <TabsTrigger
            value="list_litmas"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Layanan Terdaftar
          </TabsTrigger>
        </TabsList>

        <Button
          variant="outline"
          size="sm"
          onClick={handlers.fetchTableData}
          className="gap-2 text-xs font-semibold border-slate-200 hover:bg-slate-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', state.loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: DATA KLIEN
      ══════════════════════════════════════════════════════ */}
      <TabsContent value="list_klien">
        <Card className="border-0 shadow-md overflow-hidden ring-1 ring-slate-200">
          {/* Header */}
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-700 to-purple-600">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-100">
                    Database Registrasi
                  </p>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Daftar Klien Terdaftar
                  </h2>
                </div>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50 pointer-events-none" />
                  <Input
                    placeholder="Cari Nama Klien..."
                    className="pl-8 h-9 w-56 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-colors"
                    value={state.searchKlienQuery}
                    onChange={(e) => handlers.setSearchKlienQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlers.handleSearchKlien()}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handlers.handleSearchKlien}
                  className="h-9 w-9 bg-white/10 hover:bg-white/20 border-white/20 border text-white"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-6">Nama Klien & NIK</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">No. Register</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Penjamin</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">JK / Usia</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">No. Telepon</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.dataKlienFull.length > 0 ? (
                  state.dataKlienFull.map((k: any) => (
                    <TableRow key={k.id_klien} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="pl-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-sm">{k.nama_klien}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {k.nik_klien || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-blue-600 font-semibold">
                          {k.nomor_register_lapas || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {k.penjamin && k.penjamin.length > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{k.penjamin[0].nama_penjamin}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{k.penjamin[0].hubungan_klien}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {k.jenis_kelamin} / {k.usia} Thn
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{k.nomor_telepon || '—'}</span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400"
                            onClick={() => { handlers.setDetailData(k); handlers.setOpenDetail(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400"
                            onClick={() => handlers.handleEditClick(k)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-medium">Data tidak ditemukan.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ══════════════════════════════════════════════════════
          TAB: LAYANAN TERDAFTAR
      ══════════════════════════════════════════════════════ */}
      <TabsContent value="list_litmas">
        <Card className="border-0 shadow-md overflow-hidden ring-1 ring-slate-200">
          {/* Header */}
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-600 to-amber-600">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-100">
                    Status Registrasi
                  </p>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Data Layanan Terdaftar
                  </h2>
                </div>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50 pointer-events-none" />
                  <Input
                    placeholder="Cari No. Surat..."
                    className="pl-8 h-9 w-56 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-colors"
                    value={state.searchLitmasQuery}
                    onChange={(e) => handlers.setSearchLitmasQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlers.handleSearchLitmas()}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handlers.handleSearchLitmas}
                  className="h-9 w-9 bg-white/10 hover:bg-white/20 border-white/20 border text-white"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-6">No. Surat</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori & Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tahapan & Jenis</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Klien & Reg</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Petugas PK</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.dataLitmas.length > 0 ? (
                  state.dataLitmas.map((l: any) => (
                    <TableRow key={l.id_litmas || l._id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="pl-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-semibold text-slate-800">
                            {l.nomor_surat_permintaan || '—'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Tgl: {l.tanggal_surat_permintaan || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {l.kategori_layanan ? l.kategori_layanan.toUpperCase() : 'LITMAS'}
                          </span>
                          <StatusBadge status={l.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-slate-700">{l.tahapan_layanan || '—'}</span>
                          <span className="text-[11px] text-slate-400">{l.jenis_litmas || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-800">{l.klien?.nama_klien}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Reg: {l.klien?.nomor_register_lapas || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {l.petugas_pk ? (
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <UserCheck className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-semibold">{l.petugas_pk.nama}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-rose-500 italic font-medium">Belum Ada PK</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-slate-400"
                            onClick={() => { handlers.setSelectedLitmasDetail(l); handlers.setOpenLitmasDetail(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400"
                            onClick={() => handlers.handleEditLayananClick(l)}
                            title="Edit Layanan"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-medium">Data tidak ditemukan.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};