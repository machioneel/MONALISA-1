import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, FileText, CalendarDays, Clock, BookOpen, Activity, Loader2, MapPin, Phone, CheckSquare, Plus, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetailPembimbinganDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: any; 
}

export function DetailPembimbinganDialog({ isOpen, onOpenChange, task }: DetailPembimbinganDialogProps) {
  const { toast } = useToast();
  const [wajibLaporData, setWajibLaporData] = useState<any[]>([]);
  const [bukuBimbinganData, setBukuBimbinganData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- STATE UNTUK FITUR ABSENSI ---
  const [isAbsensiOpen, setIsAbsensiOpen] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<any>(null);
  const [isSubmittingAbsen, setIsSubmittingAbsen] = useState(false);
  const [absenForm, setAbsenForm] = useState({
    tanggal: '',
    status: 'Hadir',
    catatan: ''
  });

  // --- STATE UNTUK PREVIEW FOTO ---
  const [isPhotoViewOpen, setIsPhotoViewOpen] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

  useEffect(() => {
    if (isOpen && task?.id_klien) {
      fetchRiwayatKlien();
    }
  }, [isOpen, task]);

  const fetchRiwayatKlien = async () => {
    setLoadingData(true);
    try {
      const db: any = supabase;
      const { data: wlData, error: wlError } = await db
        .from('wajib_lapor')
        .select('*')
        .eq('id_klien', task.id_klien)
        .order('created_at', { ascending: false });
      
      if (!wlError && wlData) setWajibLaporData(wlData);

      const { data: bbData, error: bbError } = await db
        .from('peserta_bimbingan')
        .select('*, jadwal_bimbingan(*)')
        .eq('id_klien', task.id_klien)
        .order('created_at', { ascending: false });

      if (!bbError && bbData) setBukuBimbinganData(bbData);

    } catch (error) {
      console.error("Gagal mengambil detail riwayat:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenAbsensi = (pesertaItem: any) => {
    setSelectedPeserta(pesertaItem);
    setAbsenForm({
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Hadir',
      catatan: ''
    });
    setIsAbsensiOpen(true);
  };

  const handleSimpanAbsensi = async () => {
    if (!absenForm.tanggal || !absenForm.status) {
      toast({ variant: "destructive", title: "Gagal", description: "Tanggal dan Status wajib diisi." });
      return;
    }

    setIsSubmittingAbsen(true);
    try {
      const currentAbsensi = Array.isArray(selectedPeserta.absensi) ? selectedPeserta.absensi : [];
      const newEntry = {
        id: Date.now().toString(),
        tanggal: absenForm.tanggal,
        status: absenForm.status,
        catatan: absenForm.catatan,
        diinput_oleh: task.nama_pk || 'Sistem PK'
      };

      const updatedAbsensi = [...currentAbsensi, newEntry];
      const db: any = supabase;
      const { error } = await db
        .from('peserta_bimbingan')
        .update({ absensi: updatedAbsensi })
        .eq('id', selectedPeserta.id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Absensi berhasil disimpan." });
      
      const updatedPeserta = { ...selectedPeserta, absensi: updatedAbsensi };
      setSelectedPeserta(updatedPeserta);
      setBukuBimbinganData(prev => prev.map(p => p.id === selectedPeserta.id ? updatedPeserta : p));
      setAbsenForm(prev => ({ ...prev, catatan: '' }));

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmittingAbsen(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTimeIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- FUNGSI MEMBUAT PROYEKSI JADWAL WAJIB LAPOR BULANAN ---
  const generateJadwalWajibLapor = () => {
    if (!task?.tanggal_registrasi || !task?.tanggal_pengakhiran) return [];
    
    const start = new Date(task.tanggal_registrasi);
    const end = new Date(task.tanggal_pengakhiran);
    const today = new Date();
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);

    const jadwalLengkap = [];

    while (current <= endLimit) {
      const month = current.getMonth();
      const year = current.getFullYear();

      const laporanAda = wajibLaporData.find(wl => {
        const wlDate = new Date(wl.created_at || wl.tanggal_lapor);
        return wlDate.getMonth() === month && wlDate.getFullYear() === year;
      });

      let statusBelum = "Belum";
      if (!laporanAda) {
        const isPastMonth = (year < today.getFullYear()) || (year === today.getFullYear() && month < today.getMonth());
        if (isPastMonth) statusBelum = "Terlewat";
      }

      jadwalLengkap.push({
        idPeriode: `${year}-${month}`,
        namaBulan: current.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        laporanAsli: laporanAda || null,
        statusHitung: laporanAda ? 'Sudah' : statusBelum
      });

      current.setMonth(current.getMonth() + 1);
    }

    return jadwalLengkap;
  };

  if (!task) return null;
  const klien = task.klien || {};
  const penjamin = klien.penjamin?.[0] || {};
  const jadwalWajibLapor = generateJadwalWajibLapor();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-50/50">
          <DialogHeader className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border-4 border-blue-50">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-800">{klien.nama_klien || 'Nama Tidak Diketahui'}</DialogTitle>
                  <DialogDescription className="sr-only">Detail informasi dan riwayat klien bimbingan.</DialogDescription>
                  <div className="mt-2 flex gap-2 items-center">
                    <Badge variant="secondary" className="font-mono text-xs">{klien.nomor_register_lapas || 'No Reg -'}</Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{task.jenis_litmas || 'Bimbingan Umum'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="klien" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-white border border-slate-200 p-1 shadow-sm rounded-xl">
              <TabsTrigger value="klien" className="text-xs font-semibold gap-2"><User className="w-4 h-4"/> Info Klien & Penjamin</TabsTrigger>
              <TabsTrigger value="program" className="text-xs font-semibold gap-2"><FileText className="w-4 h-4"/> Program & SK</TabsTrigger>
              <TabsTrigger value="wajib_lapor" className="text-xs font-semibold gap-2"><Activity className="w-4 h-4"/> Jadwal Wajib Lapor</TabsTrigger>
              <TabsTrigger value="buku_bimbingan" className="text-xs font-semibold gap-2"><BookOpen className="w-4 h-4"/> Buku Bimbingan</TabsTrigger>
            </TabsList>

            <TabsContent value="klien" className="space-y-4 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-700">Data Klien</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">NIK</span><span className="col-span-2 font-medium text-slate-800">{klien.nik_klien || '-'}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">TTL</span><span className="col-span-2 font-medium text-slate-800">{klien.tempat_lahir || '-'}, {formatDateIndo(klien.tanggal_lahir)}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Agama</span><span className="col-span-2 font-medium text-slate-800">{klien.agama || '-'}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Pekerjaan</span><span className="col-span-2 font-medium text-slate-800">{klien.pekerjaan || '-'}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Telepon</span><span className="col-span-2 font-medium text-slate-800 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400"/> {klien.nomor_telepon || '-'}</span></div>
                    <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Alamat</span><span className="col-span-2 font-medium text-slate-800 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"/> {klien.alamat || '-'}, Kel. {klien.kelurahan || '-'}</span></div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-700">Data Penjamin</h3>
                  </div>
                  {Object.keys(penjamin).length > 0 ? (
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Nama</span><span className="col-span-2 font-medium text-slate-800">{penjamin.nama_penjamin || '-'}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Hubungan</span><span className="col-span-2 font-medium text-slate-800">{penjamin.hubungan_klien || '-'}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Pekerjaan</span><span className="col-span-2 font-medium text-slate-800">{penjamin.pekerjaan || '-'}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Telepon</span><span className="col-span-2 font-medium text-slate-800 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400"/> {penjamin.nomor_telepon || '-'}</span></div>
                      <div className="grid grid-cols-3 gap-1"><span className="text-slate-500">Alamat</span><span className="col-span-2 font-medium text-slate-800 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"/> {penjamin.alamat || '-'}, Kel. {penjamin.kelurahan || '-'}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic py-4">Belum ada data penjamin.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="program" className="outline-none">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Detail Program Pembimbingan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Nomor Registrasi</p>
                      <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded-md border border-slate-100">{task.nomor_register_litmas || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Masa Bimbingan</p>
                      <div className="flex flex-col gap-1.5 text-sm bg-blue-50/50 p-3 rounded-md border border-blue-100">
                        <div className="flex justify-between items-center"><span className="text-slate-600 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/> Mulai :</span> <span className="font-bold text-slate-800">{formatDateIndo(task.tanggal_registrasi)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Pengakhiran :</span> <span className="font-bold text-rose-600">{formatDateIndo(task.tanggal_pengakhiran)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Surat Keputusan (SK)</p>
                    <div className="text-sm bg-amber-50/50 p-3 rounded-md border border-amber-100 space-y-2">
                      <div className="flex justify-between items-center"><span className="text-slate-600">No. SK:</span> <span className="font-medium text-slate-800">{task.nomor_surat_permintaan || '-'}</span></div>
                      {task.file_surat_keputusan_url && (
                        <a href={task.file_surat_keputusan_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-xs font-semibold transition-colors">
                          <FileText className="w-3.5 h-3.5"/> Buka Dokumen SK
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB WAJIB LAPOR DENGAN GARIS VERTIKAL (DIVIDE-X) & PADDING (PX-4) */}
            <TabsContent value="wajib_lapor" className="outline-none">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    {/* Pembatas kolom Header */}
                    <TableRow className="bg-slate-50 divide-x divide-slate-200">
                      <TableHead className="w-[150px] px-4">Periode Bulan</TableHead>
                      <TableHead className="w-[150px] px-4">Tgl Lapor Aktual</TableHead>
                      <TableHead className="px-4">Metode</TableHead>
                      <TableHead className="px-4">Keterangan</TableHead>
                      <TableHead className="text-center px-4 w-[110px]">Foto</TableHead>
                      <TableHead className="text-right px-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingData ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400"/></TableCell></TableRow>
                    ) : jadwalWajibLapor.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500 italic">Masa bimbingan klien belum ditentukan.</TableCell></TableRow>
                    ) : (
                      jadwalWajibLapor.map((jadwal) => {
                        const wl = jadwal.laporanAsli;
                        
                        {/* Pembatas kolom Body */}
                        return (
                          <TableRow key={jadwal.idPeriode} className="divide-x divide-slate-200 hover:bg-slate-50 transition-colors">
                            <TableCell className="font-bold text-slate-700 text-xs bg-slate-50/30 px-4">
                              {jadwal.namaBulan}
                            </TableCell>

                            <TableCell className="text-xs font-medium text-slate-600 px-4">
                              {wl ? formatDateTimeIndo(wl.created_at) : <span className="text-slate-300 italic">Belum Lapor</span>}
                            </TableCell>
                            
                            <TableCell className="px-4">
                              {wl ? (
                                <Badge variant="outline" className="text-[10px] font-bold text-blue-700 uppercase tracking-tighter bg-blue-50 border-blue-200">
                                  {wl.metode_lapor || 'Tatap Muka'}
                                </Badge>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-slate-600 px-4">
                              <div className="line-clamp-2 max-w-[200px]">
                                {wl ? (wl.keterangan || wl.catatan || '-') : <span className="text-slate-300">-</span>}
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center px-4">
                              {wl && wl.foto_url ? (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentPhotoUrl(wl.foto_url);
                                    setIsPhotoViewOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] h-auto font-bold transition-colors border border-indigo-100"
                                >
                                  <ImageIcon className="w-3 h-3" /> Cek Foto
                                </Button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right px-4">
                              {jadwal.statusHitung === 'Sudah' ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Sudah</Badge>
                              ) : jadwal.statusHitung === 'Terlewat' ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Terlewat</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">Belum</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TAB BUKU BIMBINGAN JUGA DIBERI GARIS VERTIKAL AGAR KONSISTEN */}
            <TabsContent value="buku_bimbingan" className="outline-none">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 divide-x divide-slate-200">
                      <TableHead className="px-4">Nama Kegiatan Bimbingan</TableHead>
                      <TableHead className="px-4">Waktu Pelaksanaan</TableHead>
                      <TableHead className="text-center px-4">Hadir</TableHead>
                      <TableHead className="text-right px-4">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingData ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400"/></TableCell></TableRow>
                    ) : bukuBimbinganData.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500 italic">Belum terdaftar.</TableCell></TableRow>
                    ) : (
                      bukuBimbinganData.map((item) => {
                        const jadwal = item.jadwal_bimbingan || {};
                        const totalHadir = Array.isArray(item.absensi) ? item.absensi.filter((a: any) => a.status === 'Hadir').length : 0;
                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50 divide-x divide-slate-200">
                            <TableCell className="px-4"><p className="font-bold text-slate-800 text-sm">{jadwal.nama_kegiatan || '?'}</p><Badge variant="secondary" className="text-[10px] mt-1">{jadwal.jenis_kegiatan}</Badge></TableCell>
                            <TableCell className="text-xs text-slate-600 px-4">{formatDateIndo(jadwal.tanggal_mulai)}</TableCell>
                            <TableCell className="text-center px-4"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{totalHadir}x</Badge></TableCell>
                            <TableCell className="text-right px-4"><Button size="sm" onClick={() => handleOpenAbsensi(item)} className="bg-blue-600 h-8 text-xs w-[100px]"><CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Absen</Button></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG PREVIEW FOTO --- */}
      <Dialog open={isPhotoViewOpen} onOpenChange={setIsPhotoViewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full z-50"
              onClick={() => setIsPhotoViewOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            {currentPhotoUrl ? (
              <img 
                src={currentPhotoUrl} 
                alt="Bukti Wajib Lapor" 
                className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl"
              />
            ) : (
              <div className="text-white flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Memuat foto...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG ABSENSI (JUGA DIBERI GARIS VERTIKAL PADA RIWAYAT) --- */}
      {selectedPeserta && (
        <Dialog open={isAbsensiOpen} onOpenChange={setIsAbsensiOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-50">
            <DialogHeader><DialogTitle className="text-sm font-bold">Absensi: {selectedPeserta.jadwal_bimbingan?.nama_kegiatan}</DialogTitle></DialogHeader>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</Label><Input type="date" value={absenForm.tanggal} onChange={e => setAbsenForm(prev => ({ ...prev, tanggal: e.target.value }))} className="h-8 text-xs" /></div>
                <div className="grid gap-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase">Status</Label>
                  <Select value={absenForm.status} onValueChange={v => setAbsenForm(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-white h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Hadir">Hadir</SelectItem><SelectItem value="Izin">Izin</SelectItem><SelectItem value="Alpa">Alpa</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase">Catatan</Label><Input placeholder="Catatan PK..." value={absenForm.catatan} onChange={e => setAbsenForm(prev => ({ ...prev, catatan: e.target.value }))} className="h-8 text-xs" /></div>
              <Button onClick={handleSimpanAbsensi} disabled={isSubmittingAbsen} className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-xs font-bold">
                {isSubmittingAbsen ? "Menyimpan..." : "Simpan Absensi"}
              </Button>
            </div>
            <div className="max-h-[150px] overflow-y-auto bg-white rounded border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 divide-x divide-slate-200">
                    <TableHead className="px-4 text-xs font-bold h-8">Tanggal</TableHead>
                    <TableHead className="px-4 text-xs font-bold h-8">Status</TableHead>
                    <TableHead className="px-4 text-xs font-bold h-8">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {selectedPeserta.absensi?.map((absen: any, i: number) => (
                  <TableRow key={i} className="hover:bg-slate-50 divide-x divide-slate-200">
                    <TableCell className="text-[10px] py-2 px-4">{formatDateIndo(absen.tanggal)}</TableCell>
                    <TableCell className="py-2 px-4"><Badge variant="outline" className="text-[9px] uppercase font-bold">{absen.status}</Badge></TableCell>
                    <TableCell className="text-[9px] text-slate-500 italic py-2 px-4">{absen.catatan || '-'}</TableCell>
                  </TableRow>
                )).reverse()}
              </TableBody></Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}