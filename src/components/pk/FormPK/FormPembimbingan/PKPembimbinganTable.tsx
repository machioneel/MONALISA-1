import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Clock, FileText, ListCollapse, UserX, Loader2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { DetailPembimbinganDialog } from './DetailPembimbinganDialog';

interface PKPembimbinganTableProps {
  tasks: any[];
  loading: boolean;
  onRefresh?: () => void;
  openLaporDialog: (task: any) => void; // Prop baru untuk membuka dialog Wajib Lapor
}

export function PKPembimbinganTable({ tasks, loading, onRefresh, openLaporDialog }: PKPembimbinganTableProps) {
  const { toast } = useToast();
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [jadwalTersedia, setJadwalTersedia] = useState<any[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);

  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [taskToEnd, setTaskToEnd] = useState<any>(null);
  const [endReason, setEndReason] = useState("Masa Bimbingan Habis");
  const [endNotes, setEndNotes] = useState("");
  const [suratPencabutan, setSuratPencabutan] = useState<File | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const fetchJadwalBimbingan = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('jadwal_bimbingan')
        .select('*')
        .eq('status', 'Open')
        .gte('tanggal_selesai', new Date().toISOString().split('T')[0]); 
      if (error) throw error;
      setJadwalTersedia(data || []);
    } catch (err: any) {
      console.error("Gagal memuat jadwal:", err.message);
    }
  };

  useEffect(() => {
    fetchJadwalBimbingan();
  }, []);

  const openRegisterDialog = (task: any) => {
    setSelectedTask(task);
    setSelectedJadwal("");
    setIsRegisterOpen(true);
  };

  const handleRegisterKegiatan = async () => {
    if (!selectedJadwal || !selectedTask) {
      toast({ variant: "destructive", title: "Pilih jadwal terlebih dahulu" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('peserta_bimbingan')
        .insert({
          id_jadwal: selectedJadwal,
          id_klien: selectedTask.id_klien,
          didaftarkan_oleh: selectedTask.nama_pk,
          is_auto: false,
          absensi: []
        });

      if (error) {
        if (error.code === '23505') throw new Error("Klien ini sudah terdaftar di kegiatan tersebut.");
        throw error;
      }
      toast({ title: "Berhasil", description: "Klien berhasil didaftarkan ke kegiatan bimbingan." });
      setIsRegisterOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mendaftar", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailDialog = (task: any) => {
    setDetailTask(task);
    setIsDetailOpen(true);
  };

  const openEndDialog = (task: any) => {
    setTaskToEnd(task);
    setEndReason("Masa Bimbingan Habis");
    setEndNotes("");
    setSuratPencabutan(null);
    setIsEndDialogOpen(true);
  };

  const handleAkhiriPembimbingan = async () => {
    if (!taskToEnd) return;
    setIsEnding(true);

    try {
      let suratUrl = null;
      if (suratPencabutan) {
        const fileExt = suratPencabutan.name.split('.').pop();
        const fileName = `surat_pengakhiran/${Date.now()}_${taskToEnd.id_klien}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, suratPencabutan);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
        suratUrl = publicUrlData.publicUrl;
      }

      const tableName = taskToEnd.tabel_sumber || 'pembimbingan';
      const columnName = `id_${tableName}`;

      const updateData: any = { 
        status: 'Selesai',
        catatan_pengakhiran: `Alasan: ${endReason}. Catatan: ${endNotes}`
      };
      
      if (suratUrl) {
        updateData.surat_pengakhiran_url = suratUrl;
      }

      const { error } = await (supabase as any)
        .from(tableName)
        .update(updateData)
        .eq(columnName, taskToEnd.id_layanan);

      if (error) throw error;

      toast({ title: "Bimbingan Diakhiri", description: "Status klien berhasil diperbarui menjadi Selesai." });
      setIsEndDialogOpen(false);
      if (onRefresh) onRefresh();
      
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengakhiri", description: err.message });
    } finally {
      setIsEnding(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 divide-x divide-slate-200">
              <TableHead className="w-[30%] font-bold text-slate-700 px-4">Klien Bimbingan</TableHead>
              <TableHead className="w-[12%] font-bold text-slate-700 px-4">Dokumen SK</TableHead>
              <TableHead className="w-[15%] font-bold text-slate-700 px-4">Program</TableHead>
              <TableHead className="w-[12%] font-bold text-slate-700 px-4">Masa Bimbingan</TableHead>
              <TableHead className="w-[12%] font-bold text-slate-700 text-center px-4">Detail & Riwayat</TableHead>
              <TableHead className="w-[12%] font-bold text-slate-700 text-center px-4">Aksi & Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  {loading ? "Memuat data pembimbingan..." : "Tidak ada klien dalam program pembimbingan aktif."}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={`pembimbingan-${task.id_layanan || task.id_pembimbingan || Math.random()}`} className="hover:bg-blue-50/50 transition-colors divide-x divide-slate-200">
                  <TableCell className="align-middle py-4 px-4">
                    <div className="font-bold text-slate-900 text-base">{task.klien?.nama_klien}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">
                      Reg: {task.klien?.nomor_register_lapas || '-'}
                    </div>
                  </TableCell>

                  <TableCell className="align-middle py-4 px-4">
                    {task.file_surat_keputusan_url ? (
                      <a href={task.file_surat_keputusan_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline w-fit bg-blue-50 px-2 py-1 rounded-md">
                        <FileText className="w-3.5 h-3.5" /> Lihat SK
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada SK</span>
                    )}
                  </TableCell>

                  <TableCell className="align-middle py-4 px-4">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-normal text-left">
                      {task.jenis_litmas || 'Bimbingan Umum'}
                    </Badge>
                  </TableCell>

                  <TableCell className="align-middle py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="text-slate-400 font-medium">Mulai:</span> <strong className="text-slate-800">{formatDateIndo(task.tanggal_registrasi)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs text-rose-600">
                        <span className="text-rose-400/80 font-medium">Akhir:</span> <strong className="text-rose-700">{formatDateIndo(task.tanggal_pengakhiran)}</strong>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-middle py-4 px-4 text-center">
                    <Button size="sm" variant="outline" onClick={() => openDetailDialog(task)} className="w-full justify-center text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-blue-700 h-8 text-xs font-medium transition-all px-2">
                      <ListCollapse className="w-3.5 h-3.5 mr-1" /> Detail & Riwayat
                    </Button>
                  </TableCell>

                  <TableCell className="align-middle py-4 px-4">
                    <div className="flex flex-col gap-2 items-center">
                      <Button size="sm" onClick={() => openLaporDialog(task)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center shadow-sm h-8 text-xs font-medium transition-all px-2">
                        <Camera className="w-3.5 h-3.5 mr-1" /> Wajib Lapor
                      </Button>
                      <Button size="sm" onClick={() => openRegisterDialog(task)} className="bg-blue-600 hover:bg-blue-700 text-white w-full justify-center shadow-sm h-8 text-xs font-medium transition-all px-2">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Daftar Bimbingan
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEndDialog(task)} className="w-full justify-center text-rose-700 border-rose-300 hover:bg-rose-50 hover:text-rose-800 h-8 text-xs font-medium transition-all px-2">
                        <UserX className="w-3.5 h-3.5 mr-1" /> Akhiri Bimbingan
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Daftarkan Klien ke Kegiatan</DialogTitle>
            <DialogDescription>
              Pilih jadwal kegiatan yang tersedia untuk klien <b>{selectedTask?.klien?.nama_klien}</b>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Jadwal Kegiatan Bimkemas</Label>
            <Select value={selectedJadwal} onValueChange={setSelectedJadwal}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Pilih jadwal..." />
              </SelectTrigger>
              <SelectContent>
                {jadwalTersedia.length === 0 ? (
                  <SelectItem value="empty" disabled>Tidak ada jadwal tersedia</SelectItem>
                ) : (
                  jadwalTersedia.map((jdwl) => (
                    <SelectItem key={jdwl.id} value={jdwl.id}>
                      {jdwl.nama_kegiatan}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-500 mt-2 italic">*Jadwal ini diinisiasi dan dibuat oleh pihak Bimkemas (Kasubsie).</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Batal</Button>
            <Button onClick={handleRegisterKegiatan} disabled={!selectedJadwal || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Daftarkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {taskToEnd && (
        <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-rose-700 flex items-center gap-2">
                <UserX className="w-5 h-5" /> Konfirmasi Pengakhiran
              </DialogTitle>
              <DialogDescription>
                Anda akan mengakhiri program pembimbingan untuk <b>{taskToEnd?.klien?.nama_klien}</b>. Klien yang telah diakhiri statusnya (Selesai) akan dihilangkan dari daftar aktif.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold text-slate-700">Alasan Pengakhiran <span className="text-red-500">*</span></Label>
                <Select value={endReason} onValueChange={setEndReason}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Pilih alasan pengakhiran..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masa Bimbingan Habis">Masa Bimbingan Telah Berakhir Sesuai SK</SelectItem>
                    <SelectItem value="Tindak Pidana Baru">Melakukan Tindak Pidana Baru (Pencabutan)</SelectItem>
                    <SelectItem value="Meninggal Dunia">Klien Meninggal Dunia</SelectItem>
                    <SelectItem value="Melarikan Diri">Melarikan Diri / Tidak Kooperatif</SelectItem>
                    <SelectItem value="Lainnya">Lainnya...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-sm font-semibold text-slate-700">Surat Pencabutan / Pengakhiran (Opsional)</Label>
                <Input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSuratPencabutan(e.target.files?.[0] || null)}
                  className="bg-white border-slate-300 cursor-pointer"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold text-slate-700">Catatan Detail (Opsional)</Label>
                <Textarea 
                  placeholder="Misalnya: Klien ditangkap oleh pihak kepolisian resor X pada tanggal..." 
                  value={endNotes} 
                  onChange={(e) => setEndNotes(e.target.value)} 
                  className="bg-white border-slate-300"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEndDialogOpen(false)}>Batalkan</Button>
              <Button onClick={handleAkhiriPembimbingan} disabled={isEnding} className="bg-rose-600 hover:bg-rose-700 text-white">
                {isEnding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</> : "Ya, Akhiri Pembimbingan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DetailPembimbinganDialog 
        isOpen={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        task={detailTask} 
      />
    </>
  );
}