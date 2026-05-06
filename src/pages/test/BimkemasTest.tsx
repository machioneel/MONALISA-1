import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestPageLayout } from '@/components/TestPageLayout'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plus, Users, Calendar, Loader2, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BimkemasTest() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  const isBimkemas = hasRole('bimkemas') || hasRole('admin');

  // --- STATE DATA UTAMA ---
  const [jadwalList, setJadwalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE UI FORM JADWAL ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- STATE KONFIRMASI HAPUS ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- STATE DIALOG PESERTA BARU ---
  const [isPesertaDialogOpen, setIsPesertaDialogOpen] = useState(false);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [loadingPeserta, setLoadingPeserta] = useState(false);
  const [selectedJadwalNama, setSelectedJadwalNama] = useState("");

  // --- STATE SINKRONISASI MANUAL ---
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // --- STATE FORMULIR ---
  const initialFormState = {
    nama_kegiatan: '',
    jenis_kegiatan: 'Perintis',
    tanggal_mulai: '',
    tanggal_selesai: '',
    kuota: 50,
    keterangan: '',
    status: 'Open'
  };
  const [formData, setFormData] = useState(initialFormState);

  // 1. FUNGSI MENGAMBIL DATA JADWAL
  const fetchJadwal = async () => {
    setLoading(true);
    try {
      const db: any = supabase;
      const { data, error } = await db
        .from('jadwal_bimbingan')
        .select('*')
        .order('tanggal_mulai', { ascending: false });

      if (error) throw error;
      setJadwalList(data || []);
    } catch (error: any) {
      console.error("Error fetching jadwal:", error);
      toast({ variant: "destructive", title: "Gagal memuat data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  // 2. FUNGSI MENANGANI PERUBAHAN INPUT FORMULIR
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. FUNGSI MENGAMBIL DATA PESERTA UNTUK JADWAL TERTENTU
  const handleLihatPeserta = async (jadwal: any) => {
    setSelectedJadwalNama(jadwal.nama_kegiatan);
    setIsPesertaDialogOpen(true);
    setLoadingPeserta(true);
    
    try {
      const db: any = supabase;
      const { data, error } = await db
        .from('peserta_bimbingan')
        .select('*, klien(*)')
        .eq('id_jadwal', jadwal.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPesertaList(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memuat peserta", description: error.message });
    } finally {
      setLoadingPeserta(false);
    }
  };

  // 4. FUNGSI MEMBUKA FORM EDIT
  const handleEditClick = (jadwal: any) => {
    setFormData({
      nama_kegiatan: jadwal.nama_kegiatan,
      jenis_kegiatan: jadwal.jenis_kegiatan,
      tanggal_mulai: jadwal.tanggal_mulai,
      tanggal_selesai: jadwal.tanggal_selesai,
      kuota: jadwal.kuota,
      keterangan: jadwal.keterangan || '',
      status: jadwal.status
    });
    setEditingId(jadwal.id);
    setIsDialogOpen(true);
  };

  // 5. FUNGSI MENYIMPAN JADWAL BARU & EDIT
  const handleSimpanJadwal = async () => {
    if (!formData.nama_kegiatan || !formData.tanggal_mulai || !formData.tanggal_selesai) {
      toast({ variant: "destructive", title: "Validasi Gagal", description: "Nama Kegiatan dan Rentang Tanggal wajib diisi." });
      return;
    }

    if (new Date(formData.tanggal_mulai) > new Date(formData.tanggal_selesai)) {
      toast({ variant: "destructive", title: "Validasi Gagal", description: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama_kegiatan: formData.nama_kegiatan,
        jenis_kegiatan: formData.jenis_kegiatan,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        kuota: Number(formData.kuota),
        status: editingId ? formData.status : 'Open',
        keterangan: formData.keterangan
      };

      const db: any = supabase;

      if (editingId) {
        const { error } = await db.from('jadwal_bimbingan').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Jadwal kegiatan berhasil diperbarui." });
      } else {
        const { data: newJadwal, error } = await db
          .from('jadwal_bimbingan')
          .insert([payload])
          .select('id')
          .single();
        
        if (error) throw error;

        if (formData.jenis_kegiatan === 'Perintis' && newJadwal?.id) {
          import('@/lib/bimbinganUtils').then(({ syncPesertaPerintisBatch }) => {
            syncPesertaPerintisBatch(newJadwal.id, formData.tanggal_mulai);
          });
        }
        toast({ title: "Berhasil", description: "Jadwal kegiatan berhasil dibuat." });
      }
      
      setIsDialogOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      fetchJadwal();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan jadwal", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. FUNGSI MENGHAPUS JADWAL
  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      const db: any = supabase;
      const { error } = await db.from('jadwal_bimbingan').delete().eq('id', deletingId);
      if (error) throw error;
      
      toast({ title: "Berhasil", description: "Jadwal kegiatan berhasil dihapus." });
      fetchJadwal();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: "Terjadi kesalahan atau jadwal sudah memiliki peserta." });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  // 7. FUNGSI SINKRONISASI PESERTA MANUAL (REFRESH)
  const handleSyncPeserta = async (jadwal: any) => {
    setSyncingId(jadwal.id);
    try {
      // Memanggil fungsi dari bimbinganUtils
      const { syncPesertaPerintisBatch } = await import('@/lib/bimbinganUtils');
      await syncPesertaPerintisBatch(jadwal.id, jadwal.tanggal_mulai);
      
      toast({ 
        title: "Sinkronisasi Berhasil", 
        description: "Klien baru yang memenuhi syarat telah ditambahkan ke jadwal ini." 
      });
    } catch (error: any) {
      console.error("Gagal sinkronisasi manual:", error);
      toast({ variant: "destructive", title: "Gagal Sinkronisasi", description: "Terjadi kesalahan saat memproses data." });
    } finally {
      setSyncingId(null);
    }
  };

  const handleTutupDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <TestPageLayout
      title="Manajemen Jadwal Bimkemas"
      description="Kelola jadwal kegiatan Bimbingan dan Perintis untuk klien."
      permissionCode="access_bimkemas"
      icon={<CalendarDays className="w-6 h-6" />}
    >
      <Card className="border-0 shadow-md ring-1 ring-slate-200">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Daftar Jadwal Kegiatan</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Jadwal yang dibuat di sini akan muncul pada halaman Petugas PK saat mendaftarkan klien.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Buat Jadwal Baru
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="font-bold">Nama Kegiatan</TableHead>
                <TableHead className="font-bold">Jenis Program</TableHead>
                <TableHead className="font-bold">Pelaksanaan</TableHead>
                <TableHead className="font-bold text-center">Kuota</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="font-bold text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">Memuat jadwal...</p>
                  </TableCell>
                </TableRow>
              ) : jadwalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 italic border-b-0">
                    Belum ada jadwal kegiatan yang dibuat. Klik "Buat Jadwal Baru" untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                jadwalList.map((jadwal) => (
                  <TableRow key={jadwal.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="py-4">
                      <p className="font-semibold text-slate-800">{jadwal.nama_kegiatan}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{jadwal.keterangan || '-'}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {jadwal.jenis_kegiatan}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col text-xs text-slate-600 gap-1.5">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDateIndo(jadwal.tanggal_mulai)}</span>
                        <span className="text-slate-400 flex items-center gap-1.5">s.d {formatDateIndo(jadwal.tanggal_selesai)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" /> {jadwal.kuota}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge className={
                        jadwal.status === 'Open' ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" :
                        jadwal.status === 'Completed' ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200" :
                        "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200"
                      }>
                        {jadwal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-2">
                        {/* TOMBOL SYNC (HANYA UNTUK PERINTIS) */}
                        {jadwal.jenis_kegiatan === 'Perintis' && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-amber-600 border-amber-200 hover:bg-amber-50" 
                            onClick={() => handleSyncPeserta(jadwal)}
                            disabled={syncingId === jadwal.id}
                            title="Tarik peserta baru secara otomatis"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", syncingId === jadwal.id && "animate-spin")} />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-emerald-50/30" onClick={() => handleLihatPeserta(jadwal)}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Peserta
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleEditClick(jadwal)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { setDeletingId(jadwal.id); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG FORMULIR JADWAL */}
      <Dialog open={isDialogOpen} onOpenChange={handleTutupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Jadwal Kegiatan" : "Buat Jadwal Kegiatan Baru"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Sesuaikan kembali rincian kegiatan di bawah ini." : "Tentukan nama, waktu, jenis, dan kapasitas kegiatan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nama_kegiatan" className="text-xs font-semibold uppercase text-slate-500">Nama Kegiatan <span className="text-red-500">*</span></Label>
              <Input 
                id="nama_kegiatan" 
                name="nama_kegiatan" 
                placeholder="Contoh: PERINTIS Angkatan September" 
                value={formData.nama_kegiatan} 
                onChange={handleInputChange} 
                className="h-9 text-sm"
              />
            </div>
            
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase text-slate-500">Jenis Kegiatan <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.jenis_kegiatan} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, jenis_kegiatan: val }))}
              >
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder="Pilih jenis..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Perintis">Perintis</SelectItem>
                  <SelectItem value="Pembimbingan Kepribadian">Pembimbingan Kepribadian</SelectItem>
                  <SelectItem value="Pembimbingan Kemandirian">Pembimbingan Kemandirian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="tanggal_mulai" className="text-xs font-semibold uppercase text-slate-500">Tanggal Mulai <span className="text-red-500">*</span></Label>
                <Input type="date" id="tanggal_mulai" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange} className="h-9 text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tanggal_selesai" className="text-xs font-semibold uppercase text-slate-500">Tanggal Selesai <span className="text-red-500">*</span></Label>
                <Input type="date" id="tanggal_selesai" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="kuota" className="text-xs font-semibold uppercase text-slate-500">Kuota Maksimal <span className="text-red-500">*</span></Label>
              <Input 
                type="number" 
                id="kuota" 
                name="kuota" 
                value={formData.kuota} 
                onChange={handleInputChange} 
                min={1}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="keterangan" className="text-xs font-semibold uppercase text-slate-500">Keterangan / Tempat</Label>
              <Input 
                id="keterangan" 
                name="keterangan" 
                placeholder="Contoh: Aula Serbaguna Bapas..." 
                value={formData.keterangan} 
                onChange={handleInputChange} 
                className="h-9 text-sm"
              />
            </div>

            {editingId && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase text-slate-500">Status Pendaftaran</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 text-sm bg-white">
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Buka (Open)</SelectItem>
                    <SelectItem value="Closed">Tutup Sementara (Closed)</SelectItem>
                    <SelectItem value="Completed">Selesai (Completed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleTutupDialog} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleSimpanJadwal} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Simpan Jadwal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DAFTAR PESERTA */}
      <Dialog open={isPesertaDialogOpen} onOpenChange={setIsPesertaDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftar Peserta</DialogTitle>
            <DialogDescription>
              Peserta terdaftar untuk kegiatan <b>{selectedJadwalNama}</b>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nama Klien</TableHead>
                  <TableHead>Pendaftaran</TableHead>
                  <TableHead className="text-right">Didaftarkan Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPeserta ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : pesertaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500 italic">
                      Belum ada klien yang terdaftar di jadwal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  pesertaList.map((peserta) => (
                    <TableRow key={peserta.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-800">{peserta.klien?.nama_klien || 'Tanpa Nama'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Reg: {peserta.klien?.nomor_register_lapas || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs text-slate-600">{formatDateIndo(peserta.created_at)}</span>
                          {peserta.is_auto ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-[10px]">Auto Register</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px]">Manual</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-600">
                        {peserta.is_auto ? (
                          <span className="text-amber-600 font-medium italic">Didaftarkan Secara Otomatis</span>
                        ) : (
                          peserta.didaftarkan_oleh || '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPesertaDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-l-4 border-rose-600">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus jadwal ini mungkin akan mempengaruhi data absensi dan peserta yang sudah terdaftar di dalamnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setDeletingId(null); }}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-rose-600 hover:bg-rose-700 text-white">Hapus Permanen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TestPageLayout>
  );
}