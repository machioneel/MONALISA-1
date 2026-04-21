import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle2, XCircle, Search, BarChart3, ExternalLink, History, MessageSquare, Loader2, Clock, AlertCircle, FileClock } from "lucide-react"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestPageLayout } from "@/components/TestPageLayout"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AnevTest() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // State untuk Modal Riwayat/Detail
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // State untuk Modal Catatan Revisi
  const [isRevisiOpen, setIsRevisiOpen] = useState(false);
  const [revisiNotes, setRevisiNotes] = useState("");
  const [taskToRevise, setTaskToRevise] = useState<number | null>(null);

  // --- HELPER BARU: Generate URL ---
  const getDocUrl = (path: string | null) => {
    if (!path) return "#";
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         setLoading(false);
         return; 
      }

      // 1. Ambil Antrian Review (Hanya milik Anev ini)
      const { data: dataReview, error: errReview } = await (supabase as any)
        .from('litmas')
        .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama)
        `)
        .eq('status', 'Review')
        .eq('assigned_anev_id', user.id)
        .order('waktu_upload_laporan', { ascending: true });

      if (errReview) throw errReview;
      setReviews(dataReview || []);

      // 2. Ambil History (Hanya milik Anev ini)
      const { data: dataHistory, error: errHistory } = await (supabase as any)
        .from('litmas')
        .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama)
        `)
        .not('status', 'in', '("New Task","On Progress","Review")') 
        .eq('assigned_anev_id', user.id)
        .order('waktu_verifikasi_anev', { ascending: false }); // Urutkan dari yg terbaru diverifikasi

      if (errHistory) throw errHistory;
      setHistory(dataHistory || []);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const updatePayload: any = { 
        status: 'Approved',
        waktu_verifikasi_anev: new Date().toISOString(),
        anev_notes: 'Laporan disetujui tanpa catatan.' // Hapus catatan revisi sebelumnya jika ada
      };

      const { error } = await supabase
        .from('litmas')
        .update(updatePayload)
        .eq('id_litmas', id);

      if (error) throw error;
      toast({ title: "Sukses", description: "Laporan disetujui." });
      
      // LOGIC: Kirim notifikasi WA ke PK bahwa laporan telah disetujui (Opsional)
      
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const openRevisiModal = (id: number) => {
    setTaskToRevise(id);
    setRevisiNotes("");
    setIsRevisiOpen(true);
  };

  const submitRevision = async () => {
    if (!taskToRevise) return;
    if (!revisiNotes.trim()) {
        toast({ variant: "destructive", title: "Gagal", description: "Catatan revisi tidak boleh kosong." });
        return;
    }

    try {
      const updatePayload: any = { 
          status: 'Revision',
          anev_notes: revisiNotes,
          waktu_verifikasi_anev: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('litmas')
        .update(updatePayload)
        .eq('id_litmas', taskToRevise);

      if (error) throw error;
      
      toast({ title: "Revisi Dikirim", description: "Laporan dikembalikan ke PK beserta catatan Anda." });
      
      // LOGIC: Kirim Notifikasi WA ke PK terkait Revisi
      
      setIsRevisiOpen(false);
      setTaskToRevise(null);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.klien?.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.jenis_litmas && r.jenis_litmas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <TestPageLayout 
      title="Dashboard Anev" 
      description="Verifikasi dan monitoring laporan litmas yang masuk."
      permissionCode="access_anev"
      icon={<BarChart3 className="w-6 h-6" />}
    >
      <div className="space-y-6">
        
        {/* Statistik Ringkas */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Antrian Review</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
                    <p className="text-xs text-muted-foreground">Menunggu verifikasi Anda</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Selesai Diverifikasi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {history.filter(h => h.status === 'Approved' || h.status === 'Selesai' || h.status === 'TPP Scheduled').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Laporan disetujui</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Dikembalikan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                         {history.filter(h => h.status === 'Revision').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Laporan dalam status revisi PK</p>
                </CardContent>
            </Card>
        </div>

        {/* Tabel Antrian Review */}
        <Card className="border-t-4 border-blue-500 shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/> Daftar Verifikasi Masuk</CardTitle>
                    <CardDescription>Laporan layanan yang butuh persetujuan Anda segera.</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cari nama klien..." 
                        className="pl-9 bg-white" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-100/50">
                <TableRow>
                  <TableHead className="pl-6">Klien</TableHead>
                  <TableHead>Jenis Layanan</TableHead>
                  <TableHead>PK Penanggungjawab</TableHead>
                  <TableHead>Waktu Upload Laporan</TableHead>
                  <TableHead>File Laporan</TableHead>
                  <TableHead className="text-right pr-6">Aksi Anev</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/>Memuat antrian...</TableCell>
                    </TableRow>
                ) : filteredReviews.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500 flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-slate-300 mb-2" />
                            Hebat! Tidak ada antrian review saat ini.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredReviews.map((item) => (
                    <TableRow key={item.id_litmas}>
                        <TableCell className="pl-6">
                            <button 
                                onClick={() => { setSelectedTask(item); setIsDetailOpen(true); }}
                                className="text-left font-semibold text-slate-800 hover:text-blue-600 hover:underline transition-colors"
                            >
                                {item.klien?.nama_klien}
                            </button>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Reg: {item.klien?.nomor_register_lapas}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="bg-slate-50 font-normal mb-1">{item.kategori_layanan?.toUpperCase() || 'LITMAS'}</Badge>
                            <div className="text-xs font-medium text-slate-700">{item.jenis_litmas}</div>
                        </TableCell>
                        <TableCell>
                            <span className="font-medium text-blue-700">{item.petugas_pk?.nama}</span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Clock className="w-3.5 h-3.5"/> 
                                {item.waktu_upload_laporan ? formatDateTime(item.waktu_upload_laporan) : '-'}
                            </div>
                        </TableCell>
                        <TableCell>
                            {item.hasil_litmas_url ? (
                                <a 
                                  href={getDocUrl(item.hasil_litmas_url)} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center justify-center bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors text-xs font-bold border border-blue-200"
                                >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Buka Laporan <ExternalLink className="h-3 w-3 ml-1.5 opacity-50"/>
                                </a>
                            ) : (
                                <span className="text-slate-400 italic text-xs">Belum upload</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                            <Button size="sm" variant="outline" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" onClick={() => openRevisiModal(item.id_litmas)}>
                                <XCircle className="h-4 w-4 mr-1" /> Revisi
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => handleApprove(item.id_litmas)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabel Riwayat */}
        <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50">
                <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-slate-600"/> Riwayat Keputusan Verifikasi</CardTitle>
                <CardDescription>Dokumen yang sudah Anda setujui atau kembalikan.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-100/50">
                        <TableRow>
                            <TableHead className="pl-6">Klien</TableHead>
                            <TableHead>Jenis Layanan</TableHead>
                            <TableHead>PK</TableHead>
                            <TableHead>Keputusan / Status Akhir</TableHead>
                            <TableHead className="pr-6">Waktu Verifikasi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => (
                            <TableRow key={item.id_litmas}>
                                <TableCell className="pl-6 font-medium text-slate-700">
                                    <button 
                                        onClick={() => { setSelectedTask(item); setIsDetailOpen(true); }}
                                        className="text-left hover:text-blue-600 hover:underline transition-colors"
                                    >
                                        {item.klien?.nama_klien}
                                    </button>
                                </TableCell>
                                <TableCell className="text-xs">{item.jenis_litmas}</TableCell>
                                <TableCell className="text-xs font-medium">{item.petugas_pk?.nama}</TableCell>
                                <TableCell>
                                    <Badge 
                                        className={
                                            item.status === 'Approved' || item.status === 'TPP Scheduled' || item.status === 'Selesai' 
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
                                            : item.status === 'Revision'
                                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                                            : 'bg-slate-100 text-slate-800 border-slate-200'
                                        }
                                        variant="outline"
                                    >
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="pr-6 text-xs text-slate-500 font-mono">
                                    {item.waktu_verifikasi_anev ? formatDateTime(item.waktu_verifikasi_anev) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                         {history.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">Belum ada riwayat verifikasi.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>

      {/* --- MODAL INPUT CATATAN REVISI --- */}
      <Dialog open={isRevisiOpen} onOpenChange={setIsRevisiOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-700">
                    <MessageSquare className="w-5 h-5"/> Berikan Catatan Revisi
                </DialogTitle>
                <DialogDescription>
                    Tuliskan poin-poin yang perlu diperbaiki oleh PK sebelum dokumen dapat disetujui. PK akan menerima notifikasi ini.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="catatan" className="font-bold text-slate-700">Catatan Perbaikan</Label>
                    <Textarea
                        id="catatan"
                        placeholder="Contoh: Tolong perbaiki analisis di bab 3 paragraf 2 karena kurang tajam..."
                        className="min-h-[150px] resize-none focus-visible:ring-amber-500"
                        value={revisiNotes}
                        onChange={(e) => setRevisiNotes(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsRevisiOpen(false)}>Batal</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm" onClick={submitRevision}>Kirim Revisi ke PK</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DETAIL & RIWAYAT PROSES (Bisa digunakan untuk melihat log) --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
                <div className="flex items-center justify-between mr-8">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600"/> Detail & Riwayat Layanan Klien
                    </DialogTitle>
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
                        {selectedTask?.status || 'Unknown'}
                    </Badge>
                </div>
                <DialogDescription>
                    Melacak progress verifikasi dari pembuatan hingga persetujuan.
                </DialogDescription>
            </DialogHeader>
            
            {selectedTask && (
                <div className="space-y-6 py-4">
                    {/* INFO GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-100">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                            <p className="font-semibold text-slate-800">{selectedTask.klien?.nama_klien}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Layanan</span> 
                            <p className="font-medium text-slate-700">{selectedTask.jenis_litmas}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PK Penanggungjawab</span> 
                            <p className="font-medium text-blue-700">{selectedTask.petugas_pk?.nama}</p>
                        </div>
                    </div>

                    {/* Jika sedang status Revisi ATAU Punya Catatan sebelumnya */}
                    {selectedTask.anev_notes && (
                         <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                            <div>
                                <h5 className="font-bold text-amber-800 text-sm">Catatan Revisi Terakhir Anda:</h5>
                                <p className="text-amber-700 text-sm mt-1">{selectedTask.anev_notes}</p>
                            </div>
                        </div>
                    )}

                    {/* DOKUMEN LINKS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border p-3 rounded-md flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded"><FileText className="w-4 h-4 text-slate-600"/></div>
                                <div className="text-xs">
                                    <span className="block font-medium text-slate-700">Surat Permintaan (Op)</span>
                                    <span className="text-slate-400">{selectedTask.file_surat_permintaan_url ? 'Tersedia' : 'Belum upload'}</span>
                                </div>
                            </div>
                            {selectedTask.file_surat_permintaan_url && (
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(getDocUrl(selectedTask.file_surat_permintaan_url), '_blank')}>
                                    Lihat
                                </Button>
                            )}
                        </div>
                        <div className="border p-3 rounded-md flex items-center justify-between hover:bg-blue-50/50 transition-colors border-blue-100 bg-blue-50/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded"><FileClock className="w-4 h-4 text-blue-600"/></div>
                                <div className="text-xs">
                                    <span className="block font-medium text-blue-800">Hasil Laporan (PK)</span>
                                    <span className="text-blue-400">{selectedTask.hasil_litmas_url ? 'Sudah Diupload' : 'Belum Ada'}</span>
                                </div>
                            </div>
                            {selectedTask.hasil_litmas_url && (
                                <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => window.open(getDocUrl(selectedTask.hasil_litmas_url), '_blank')}>
                                    Buka File Laporan
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* TIMELINE HISTORY VISUALIZATION */}
                    <div className="border rounded-lg p-5 bg-white shadow-sm">
                        <h4 className="text-sm font-bold mb-5 flex items-center gap-2 text-slate-800">
                            <History className="w-4 h-4 text-blue-600"/> Linimasa Pengerjaan
                        </h4>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                            
                            {[
                                { date: selectedTask.waktu_registrasi, label: "Registrasi Operator", color: "bg-green-500", text: "text-slate-800" },
                                { date: selectedTask.waktu_upload_surat_tugas, label: "PK Menerima Tugas", color: "bg-green-500", text: "text-slate-800" },
                                { date: selectedTask.waktu_upload_laporan, label: "PK Upload Laporan", color: "bg-green-500", text: "text-slate-800" },
                                { date: selectedTask.waktu_verifikasi_anev, label: "Anev Memberikan Keputusan", color: selectedTask.status === 'Revision' ? "bg-amber-500" : "bg-green-500", text: "text-slate-800", extra: selectedTask.status === 'Revision' ? "Status: Revisi" : "" },
                                { date: selectedTask.waktu_sidang_tpp || (selectedTask.jadwal ? new Date(selectedTask.jadwal.tanggal_sidang).toISOString() : null), label: "Sidang TPP", color: "bg-purple-600", text: "text-slate-800" },
                                { date: selectedTask.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" }
                            ].map((item, idx) => (
                                <div key={idx} className="ml-8 relative group">
                                    <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300
                                        ${item.date ? item.color : 'bg-slate-200 group-hover:bg-slate-300'}
                                    `}></div>
                                    
                                    <div className={!item.date ? 'opacity-50 grayscale' : ''}>
                                        <p className={`text-xs font-bold ${item.text}`}>{item.label} {item.extra && <span className="ml-2 font-normal text-amber-600 border border-amber-200 bg-amber-50 px-1 rounded">{item.extra}</span>}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                            {item.date ? formatDateTime(item.date) : '-'}
                                        </p>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

    </TestPageLayout>
  );
}