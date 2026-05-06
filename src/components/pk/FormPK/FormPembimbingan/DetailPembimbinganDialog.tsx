import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// 1. Menambahkan AlertTriangle untuk icon warning
import { User, Shield, FileText, CalendarDays, Clock, BookOpen, Activity, Loader2, MapPin, Phone, CheckSquare, Image as ImageIcon, X, CheckCircle2, AlertTriangle } from 'lucide-react';
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

  const [isAbsensiOpen, setIsAbsensiOpen] = useState(false);
  const [selectedPeserta, setSelectedPeserta] = useState<any>(null);
  const [isSubmittingAbsen, setIsSubmittingAbsen] = useState(false);
  const [absenForm, setAbsenForm] = useState({
    tanggal: '',
    status: 'Hadir',
    catatan: ''
  });

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
      const { data: wlData, error: wlError } = await (supabase as any)
        .from('wajib_lapor')
        .select('*')
        .eq('id_klien', task.id_klien)
        .order('created_at', { ascending: false });
      
      if (!wlError && wlData) setWajibLaporData(wlData);

      const { data: bbData, error: bbError } = await (supabase as any)
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
    const tglMulai = pesertaItem.jadwal_bimbingan?.tanggal_mulai?.split('T')[0] || new Date().toISOString().split('T')[0];

    setAbsenForm({
      tanggal: tglMulai, 
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

    const currentAbsensi = Array.isArray(selectedPeserta.absensi) ? selectedPeserta.absensi : [];
    
    const isAlreadyAttended = currentAbsensi.some((a: any) => a.tanggal === absenForm.tanggal);
    if (isAlreadyAttended) {
      toast({ 
        variant: "destructive", 
        title: "Duplikasi Absen", 
        description: `Klien sudah di-absen pada tanggal ${formatDateIndo(absenForm.tanggal)}. Tidak dapat melakukan absen ganda.` 
      });
      return;
    }

    const tglMulai = selectedPeserta?.jadwal_bimbingan?.tanggal_mulai?.split('T')[0];
    const tglSelesai = selectedPeserta?.jadwal_bimbingan?.tanggal_selesai?.split('T')[0] || tglMulai;

    if (tglMulai && (absenForm.tanggal < tglMulai || absenForm.tanggal > tglSelesai)) {
      toast({ 
        variant: "destructive", 
        title: "Akses Ditolak", 
        description: "Absensi tidak dapat disimpan karena tanggal di luar rentang jadwal kegiatan yang telah ditetapkan." 
      });
      return;
    }

    setIsSubmittingAbsen(true);
    try {
      const newEntry = {
        id: Date.now().toString(),
        tanggal: absenForm.tanggal,
        status: absenForm.status,
        catatan: absenForm.catatan,
        diinput_oleh: task.nama_pk || 'Sistem PK'
      };

      const updatedAbsensi = [...currentAbsensi, newEntry];
      
      let isSelesai = false;
      if (tglMulai && tglSelesai) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const dateMulai = new Date(tglMulai);
        const dateSelesai = new Date(tglSelesai);
        
        const totalDaysRequired = Math.floor((dateSelesai.getTime() - dateMulai.getTime()) / msPerDay) + 1;
        const uniqueAttendedDays = new Set(updatedAbsensi.map(a => a.tanggal)).size;
        
        if (uniqueAttendedDays >= totalDaysRequired) {
          isSelesai = true;
        }
      }

      const updatePayload: any = { absensi: updatedAbsensi };
      if (isSelesai) {
        updatePayload.status = 'Selesai';
      }

      const { error: absenError } = await (supabase as any)
        .from('peserta_bimbingan')
        .update(updatePayload)
        .eq('id', selectedPeserta.id);

      if (absenError) throw absenError;

      if (isSelesai) {
        toast({ title: "Kegiatan Selesai!", description: "Target kehadiran terpenuhi. Status kepesertaan klien ini menjadi Selesai." });
      } else {
        toast({ title: "Berhasil", description: "Absensi berhasil disimpan." });
      }
      
      const updatedPeserta = { ...selectedPeserta, absensi: updatedAbsensi, status: isSelesai ? 'Selesai' : selectedPeserta.status };
      setSelectedPeserta(updatedPeserta);
      setBukuBimbinganData(prev => prev.map(p => p.id === selectedPeserta.id ? updatedPeserta : p));
      setAbsenForm(prev => ({ ...prev, catatan: '' }));

      if (isSelesai) {
        setIsAbsensiOpen(false);
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Menyimpan Absensi", description: error.message });
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

  const activeTglMulai = selectedPeserta?.jadwal_bimbingan?.tanggal_mulai?.split('T')[0] || '';
  const activeTglSelesai = selectedPeserta?.jadwal_bimbingan?.tanggal_selesai?.split('T')[0] || activeTglMulai;

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
                        <div className="flex justify-between items-center"><span className="text-slate-600 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/>Tgl. Mulai :</span> <span className="font-bold text-slate-800">{formatDateIndo(task.tanggal_registrasi)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>Tgl. Pengakhiran :</span> <span className="font-bold text-rose-600">{formatDateIndo(task.tanggal_pengakhiran)}</span></div>
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

            <TabsContent value="wajib_lapor" className="outline-none">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
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

                            {/* 2. BAGIAN PERBAIKAN TAMPILAN STATUS TERLEWAT */}
                            <TableCell className="text-right px-4">
                              {jadwal.statusHitung === 'Sudah' ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Sudah Wajib Lapor
                                </Badge>
                              ) : jadwal.statusHitung === 'Terlewat' ? (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Tidak Wajib Lapor
                                </Badge>
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
                        const isSelesai = item.status === 'Selesai';

                        return (
                          <TableRow key={item.id} className="hover:bg-slate-50 divide-x divide-slate-200">
                            <TableCell className="px-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">{jadwal.nama_kegiatan || '?'}</p>
                                {isSelesai && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[9px] h-4 py-0 px-1 border-none"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Selesai</Badge>}
                              </div>
                              <Badge variant="secondary" className="text-[10px] mt-1">{jadwal.jenis_kegiatan}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 px-4">
                              {formatDateIndo(jadwal.tanggal_mulai)} 
                              {jadwal.tanggal_selesai && jadwal.tanggal_selesai !== jadwal.tanggal_mulai && ` s/d ${formatDateIndo(jadwal.tanggal_selesai)}`}
                            </TableCell>
                            <TableCell className="text-center px-4"><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{totalHadir}x</Badge></TableCell>
                            <TableCell className="text-right px-4">
                              {isSelesai ? (
                                <Button size="sm" variant="outline" className="h-8 text-xs w-[100px] border-emerald-200 text-emerald-700 bg-emerald-50 cursor-default">Tuntas</Button>
                              ) : (
                                <Button size="sm" onClick={() => handleOpenAbsensi(item)} className="bg-blue-600 h-8 text-xs w-[100px]"><CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Absen</Button>
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
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoViewOpen} onOpenChange={setIsPhotoViewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black/90 border-none z-[100]">
          <DialogTitle className="sr-only">Pratinjau Foto</DialogTitle>
          <DialogDescription className="sr-only">Menampilkan pratinjau foto bukti Wajib Lapor klien.</DialogDescription>
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

      {selectedPeserta && (
        <Dialog open={isAbsensiOpen} onOpenChange={setIsAbsensiOpen}>
          <DialogContent className="sm:max-w-[500px] bg-slate-50 z-[100]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex flex-col">
                Absensi: {selectedPeserta.jadwal_bimbingan?.nama_kegiatan}
                <span className="text-xs font-normal text-slate-500 mt-1">Rentang: {formatDateIndo(activeTglMulai)} - {formatDateIndo(activeTglSelesai)}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulir untuk mengisi data absensi kehadiran klien.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</Label>
                  <Input 
                    type="date" 
                    min={activeTglMulai}
                    max={activeTglSelesai}
                    value={absenForm.tanggal} 
                    onChange={e => setAbsenForm(prev => ({ ...prev, tanggal: e.target.value }))} 
                    className="h-8 text-xs border-blue-300" 
                  />
                  <p className="text-[9px] text-slate-400 italic mt-0.5">Dibatasi pada rentang jadwal</p>
                </div>

                <div className="grid gap-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase">Status</Label>
                  <Select value={absenForm.status} onValueChange={v => setAbsenForm(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-white h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Hadir">Hadir</SelectItem><SelectItem value="Izin">Izin</SelectItem><SelectItem value="Alpa">Alpa</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5"><Label className="text-[10px] font-bold text-slate-500 uppercase">Catatan</Label><Input placeholder="Catatan PK..." value={absenForm.catatan} onChange={e => setAbsenForm(prev => ({ ...prev, catatan: e.target.value }))} className="h-8 text-xs bg-white" /></div>
              <Button onClick={handleSimpanAbsensi} disabled={isSubmittingAbsen} className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-xs font-bold shadow-sm transition-all">
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
                {Array.isArray(selectedPeserta.absensi) && [...selectedPeserta.absensi].reverse().map((absen: any, i: number) => (
                  <TableRow key={absen.id || i} className="hover:bg-slate-50 divide-x divide-slate-200">
                    <TableCell className="text-[10px] py-2 px-4">{formatDateIndo(absen.tanggal)}</TableCell>
                    <TableCell className="py-2 px-4"><Badge variant="outline" className="text-[9px] uppercase font-bold">{absen.status}</Badge></TableCell>
                    <TableCell className="text-[9px] text-slate-500 italic py-2 px-4">{absen.catatan || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}