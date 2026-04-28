import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Eye, Pencil, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTerdaftarProps {
  state: any;
  handlers: any;
}

export const DataTerdaftar: React.FC<DataTerdaftarProps> = ({ state, handlers }) => {
  return (
    <Tabs defaultValue="list_klien" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
            <TabsTrigger value="list_klien">Data Klien</TabsTrigger>
            <TabsTrigger value="list_litmas">Layanan Terdaftar</TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="sm" onClick={handlers.fetchTableData}>
            <RefreshCw className={cn("w-4 h-4", state.loading && "animate-spin")} />
        </Button>
      </div>
      
      <TabsContent value="list_klien">
        <Card className="border-t-4 border-t-purple-600 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                  <CardTitle>Daftar Klien Terdaftar</CardTitle>
                  <CardDescription>Database klien {state.userRoleCategory}</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-60">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Cari Nama Klien..." className="pl-8" value={state.searchKlienQuery} onChange={(e) => handlers.setSearchKlienQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlers.handleSearchKlien()} />
                </div>
                <Button size="icon" variant="outline" onClick={handlers.handleSearchKlien}><Search className="w-4 h-4"/></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Klien & NIK</TableHead>
                  <TableHead>No. Register</TableHead>
                  <TableHead>Penjamin</TableHead>
                  <TableHead>JK / Usia</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.dataKlienFull.length > 0 ? state.dataKlienFull.map((k: any) => (
                  <TableRow key={k.id_klien}>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{k.nama_klien}</span>
                            <span className="text-[10px] text-slate-500 font-mono">NIK: {k.nik_klien || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="font-mono text-blue-600 font-medium">{k.nomor_register_lapas}</span>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{k.penjamin && k.penjamin.length > 0 ? k.penjamin[0].nama_penjamin : '-'}</span>
                            <span className="text-[10px] text-slate-500">{k.penjamin && k.penjamin.length > 0 ? k.penjamin[0].hubungan_klien : ''}</span>
                        </div>
                    </TableCell>
                    <TableCell>{k.jenis_kelamin} / {k.usia} Thn</TableCell>
                    <TableCell>{k.nomor_telepon || '-'}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { handlers.setDetailData(k); handlers.setOpenDetail(true); }}>
                                <Eye className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlers.handleEditClick(k)}>
                                <Pencil className="w-4 h-4 text-amber-500 hover:text-amber-700" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="list_litmas">
        <Card className="border-t-4 border-t-orange-600 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                  <CardTitle>Data Layanan Terdaftar</CardTitle>
                  <CardDescription>Status registrasi.</CardDescription>
              </div>
              <div className="flex gap-2">
                  <div className="relative w-60">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input placeholder="Cari No. Surat..." className="pl-8" value={state.searchLitmasQuery} onChange={(e) => handlers.setSearchLitmasQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlers.handleSearchLitmas()} />
                  </div>
                  <Button size="icon" variant="outline" onClick={handlers.handleSearchLitmas}><Search className="w-4 h-4"/></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Surat</TableHead>
                  <TableHead>Kategori & Status</TableHead>
                  <TableHead>Tahapan & Jenis</TableHead>
                  <TableHead>Klien & Reg</TableHead>
                  <TableHead>Petugas PK</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.dataLitmas.length > 0 ? state.dataLitmas.map((l: any) => (
                  <TableRow key={l.id_litmas || l._id}>
                    <TableCell className="font-medium">
                        {l.nomor_surat_permintaan}
                        <div className="text-[10px] text-slate-400 mt-1">
                            Tgl: {l.tanggal_surat_permintaan}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                            <Badge variant="outline" className="text-xs bg-slate-50">{l.kategori_layanan ? l.kategori_layanan.toUpperCase() : 'LITMAS'}</Badge>
                            <Badge className={
                                l.status === 'Approved' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                l.status === 'Selesai' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                l.status === 'On Progress' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                                l.status === 'Review' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                                l.status === 'Ditolak' || l.status === 'Rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                'bg-slate-500 hover:bg-slate-600 text-white'
                            }>
                                {l.status || 'New Task'}
                            </Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-semibold text-slate-700">{l.tahapan_layanan || '-'}</span>
                            <span className="text-xs text-slate-500">{l.jenis_litmas || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{l.klien?.nama_klien}</span>
                            <span className="text-[10px] text-slate-500">Reg: {l.klien?.nomor_register_lapas || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {l.petugas_pk ? 
                            <span className="text-blue-700 font-medium flex items-center gap-1">
                                <UserCheck className="w-3 h-3"/> {l.petugas_pk.nama}
                            </span> : 
                            <span className="text-red-500 text-xs italic">Belum Ada PK</span>
                        }
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => { handlers.setSelectedLitmasDetail(l); handlers.setOpenLitmasDetail(true); }}
                        >
                            <Eye className="w-4 h-4 text-slate-500 hover:text-blue-600"/>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handlers.handleEditLayananClick(l)}
                            title="Edit Layanan"
                        >
                            <Pencil className="w-4 h-4 text-amber-500 hover:text-amber-700"/>
                        </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};