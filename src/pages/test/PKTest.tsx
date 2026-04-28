// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    User, ListFilter, Search, Camera, CheckCircle2, Eye, 
    Plus, Image as ImageIcon, ChevronsUpDown, Check, Loader2, Focus, XCircle, AlertCircle, Phone 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { PKStatsCards } from '@/components/pk/FormPK/FormLitmas/PKStatsCards';
import { PKTaskTable } from '@/components/pk/FormPK/FormLitmas/PKTaskTable';
import { PKRegisterDialog } from '@/components/pk/FormPK/FormLitmas/PKRegisterDialog';
import { PKDetailDialog } from '@/components/pk/FormPK/FormLitmas/PKDetailDialog';

interface LitmasTaskData {
  id_litmas: number;
  id_klien: number; 
  created_at: string;
  updated_at: string | null;
  status: string | null;
  jenis_litmas: string | null;
  kategori_layanan: string | null; 
  nomor_surat_permintaan: string | null;
  surat_tugas_signed_url: string | null;
  hasil_litmas_url: string | null;
  waktu_registrasi: string | null;
  waktu_upload_surat_tugas: string | null;
  waktu_upload_laporan: string | null;
  waktu_verifikasi_anev: string | null;
  waktu_sidang_tpp: string | null;
  waktu_selesai: string | null;
  asal_bapas: string | null;
  id_anev?: string | null; 
  assigned_anev_id?: string | null; 
  klien: { id_klien: number; nama_klien: string; nomor_register_lapas: string; kategori_usia: string; nomor_telepon: string; penjamin?: any[] | null; } | null;
  petugas_pk: { nama: string; nip: string; } | null;
  jadwal: { tanggal_sidang: string; jenis_sidang: string; } | null;
}

export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const [tasks, setTasks] = useState<LitmasTaskData[]>([]);
  const [wajibLaporList, setWajibLaporList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedLitmasId, setSelectedLitmasId] = useState<number | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<string>("litmas");

  // Wajib lapor states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openLaporDialog, setOpenLaporDialog] = useState(false);
  const [selectedLaporClient, setSelectedLaporClient] = useState<string>("");
  const [laporPhoto, setLaporPhoto] = useState<File | null>(null);
  const [laporPhotoPreview, setLaporPhotoPreview] = useState<string | null>(null);
  const [laporKeterangan, setLaporKeterangan] = useState("");
  const [laporTelepon, setLaporTelepon] = useState(""); // State baru untuk telepon klien
  const [laporSubmitting, setLaporSubmitting] = useState(false);
  const [openLaporCombo, setOpenLaporCombo] = useState(false);

  // Live Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [pkName, setPkName] = useState("");
  const isAdmin = hasRole('admin');

  const eligibleLaporClients = Array.from(
    new Map(
        tasks
        .filter(t => ['Approved', 'Selesai'].includes(t.status || ''))
        .filter(t => t.klien && t.id_klien)
        .map(t => [t.id_klien, { ...t.klien, id_klien: t.id_klien }])
    ).values()
  );

  const fetchMyTasksAndLapor = async () => {
    if (!user) return;
    setLoading(true);
    try {
        let pkId = null;
        if (!isAdmin) {
            const { data } = await supabase.from('petugas_pk').select('id, nama').eq('user_id', user.id).maybeSingle(); 
            if (data) { pkId = data.id; setPkName(data.nama); }
            else return;
        } else { setPkName("Administrator"); }

        let query = (supabase as any).from('litmas').select(`*, klien:klien!litmas_id_klien_fkey (*, penjamin (nama_penjamin, nomor_telepon, hubungan_klien, alamat)), petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip), jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)`).order('created_at', { ascending: false });
        if (!isAdmin && pkId) query = query.eq('nama_pk', pkId);
        
        const { data: taskData, error: taskError } = await query;
        if (taskError) throw taskError;
        setTasks(taskData as unknown as LitmasTaskData[]);

        let wQuery = (supabase as any).from('wajib_lapor').select(`*, klien!inner(id_klien, nama_klien, nomor_register_lapas, nomor_telepon, litmas!inner(nama_pk))`).order('tanggal_lapor', { ascending: false });
        if (!isAdmin && pkId) wQuery = wQuery.eq('klien.litmas.nama_pk', pkId);
        
        const { data: wData } = await wQuery;
        
        if (wData) {
            const uniqueLapor = Array.from(new Map(wData.map((item:any) => [item.id, item])).values());
            setWajibLaporList(uniqueLapor);
        }

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error Fetch", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasksAndLapor(); 
      const fetchSchedules = async () => {
          const { data } = await (supabase as any)
            .from('tpp_schedules').select('*').eq('status', 'Open').gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // Camera Logic
  useEffect(() => {
    if (isCameraOpen) { startStream(); } else { stopStream(); }
    return () => stopStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOpen]);

  const startStream = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
    } catch (err: any) {
        toast({ variant: "destructive", title: "Kamera Gagal", description: "Izin kamera ditolak." });
        setIsCameraOpen(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `lapor_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setLaporPhoto(file);
                    setLaporPhotoPreview(URL.createObjectURL(file));
                    setIsCameraOpen(false);
                }
            }, 'image/jpeg', 0.8);
        }
    }
  };

  const handleLaporPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setLaporPhoto(file);
          setLaporPhotoPreview(URL.createObjectURL(file));
      }
  };

  const resetLaporPhoto = () => {
      setLaporPhoto(null);
      setLaporPhotoPreview(null);
  };

  const closeLaporDialog = () => {
      setOpenLaporDialog(false);
      setIsCameraOpen(false);
      setSelectedLaporClient("");
      setLaporTelepon("");
      resetLaporPhoto();
      setLaporKeterangan("");
  }


  const handleUpload = async (file: File, taskId: number, type: 'surat_tugas' | 'hasil_litmas') => {
    setUploadingId(taskId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}/${taskId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw new Error(`Upload Gagal: ${upErr.message}`);

      let updateData: any = {};
      if (type === 'surat_tugas') { updateData = { surat_tugas_signed_url: path, status: 'On Progress', waktu_upload_surat_tugas: new Date().toISOString() }; }
      else { updateData = { hasil_litmas_url: path, status: 'Review', anev_notes: null, waktu_upload_laporan: new Date().toISOString() }; }

      await supabase.from('litmas').update(updateData).eq('id_litmas', taskId);
      toast({ title: "Berhasil", description: type === 'surat_tugas' ? "Surat Tugas diupload" : "File berhasil diupload" });
      fetchMyTasksAndLapor(); 
    } catch (e: any) { toast({ variant: "destructive", title: "Gagal Memproses", description: e.message }); } finally { setUploadingId(null); }
  };

  const openRegisterDialog = (id: number) => { setSelectedLitmasId(id); setSelectedScheduleId(''); setIsRegisterOpen(true); };

  const confirmRegisterTPP = async () => {
      if (!selectedScheduleId || !selectedLitmasId) return toast({ variant: "destructive", title: "Pilih jadwal dulu!" });
      const { error } = await (supabase as any).from('litmas').update({ status: 'TPP Scheduled', tpp_schedule_id: selectedScheduleId, waktu_daftar_tpp: new Date().toISOString() }).eq('id_litmas', selectedLitmasId);
      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else { toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." }); setIsRegisterOpen(false); fetchMyTasksAndLapor(); }
  };

  const handleSubmitWajibLapor = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLaporClient) return toast({ variant: "destructive", title: "Error", description: "Pilih klien terlebih dahulu." });
      if (!laporPhoto) return toast({ variant: "destructive", title: "Error", description: "Foto wajib dilampirkan." });

      setLaporSubmitting(true);
      try {
          // 1. Update No Telepon Klien jika berubah
          const { error: phoneError } = await supabase
            .from('klien')
            .update({ nomor_telepon: laporTelepon })
            .eq('id_klien', parseInt(selectedLaporClient));
          
          if (phoneError) throw phoneError;

          // 2. Upload Foto
          const fileExt = laporPhoto.name.split('.').pop();
          const fileName = `wajib_lapor/${Date.now()}_${selectedLaporClient}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, laporPhoto);
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);

          // 3. Insert Wajib Lapor
          const { error: dbError } = await (supabase as any).from('wajib_lapor').insert({
              id_klien: parseInt(selectedLaporClient),
              tanggal_lapor: new Date().toISOString(),
              foto_url: publicUrlData.publicUrl,
              keterangan: laporKeterangan,
              status_validasi: 'Valid' 
          });

          if (dbError) throw dbError;

          toast({ title: "Berhasil", description: "Wajib Lapor disimpan dan nomor telepon diperbarui." });
          closeLaporDialog();
          fetchMyTasksAndLapor();

      } catch (error: any) {
          toast({ variant: "destructive", title: "Gagal", description: error.message });
      } finally {
          setLaporSubmitting(false);
      }
  };

  const handleValidasiLapor = async (idLapor: number) => {
      try {
          const { error } = await (supabase as any).from('wajib_lapor').update({
              status_validasi: 'Valid'
          }).eq('id', idLapor);
          
          if (error) throw error;
          toast({ title: "Berhasil Divalidasi", description: "Laporan klien ini telah disahkan." });
          fetchMyTasksAndLapor();
      } catch (error: any) {
          toast({ variant: "destructive", title: "Gagal Validasi", description: error.message });
      }
  };

  const tabFilteredTasks = tasks.filter(t => {
      const category = t.kategori_layanan ? t.kategori_layanan.toLowerCase() : 'litmas';
      return category === activeTab;
  });

  const filteredTasks = tabFilteredTasks.filter(t => (t.klien?.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.klien?.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const stats = {
      new: tabFilteredTasks.filter(t => !t.status || t.status === 'New Task').length,
      process: tabFilteredTasks.filter(t => t.status === 'On Progress' || t.status === 'Revision').length,
      review: tabFilteredTasks.filter(t => t.status === 'Review').length,
      done: tabFilteredTasks.filter(t => ['Approved', 'TPP Scheduled', 'Selesai'].includes(t.status || '')).length
  };

  return (
    <TestPageLayout title="Dashboard PK" description="Manajemen Tugas & Layanan Klien" permissionCode="access_pk" icon={<User className="w-8 h-8 text-primary" />}>
      <div className="space-y-6">
        <PKStatsCards stats={stats} />

        <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ListFilter className="w-5 h-5 text-primary"/> Modul Bimbingan
                    </CardTitle>
                    <CardDescription>Kelola pekerjaan dan lapor klien.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama atau register..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-4 pb-2 bg-slate-50/30">
                    <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="litmas" className="py-2">Litmas</TabsTrigger>
                        <TabsTrigger value="pendampingan" className="py-2">Pendampingan</TabsTrigger>
                        <TabsTrigger value="pengawasan" className="py-2">Pengawasan</TabsTrigger>
                        <TabsTrigger value="pembimbingan" className="py-2">Pembimbingan</TabsTrigger>
                        <TabsTrigger value="wajib_lapor" className="py-2 flex items-center gap-2 text-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50">
                            <Camera className="w-4 h-4"/> Lapor
                        </TabsTrigger>
                    </TabsList>
                </div>

                {activeTab !== 'wajib_lapor' ? (
                    <div className="p-0">
                        <PKTaskTable tasks={filteredTasks} loading={loading} onViewDetail={(task) => { setSelectedTask(task); setIsDetailOpen(true); }} onUpload={handleUpload} onOpenRegister={openRegisterDialog} />
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                            <p className="text-sm text-emerald-800">Menampilkan daftar wajib lapor dari klien yang Anda dampingi secara aktif.</p>
                            <Button onClick={() => setOpenLaporDialog(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                                <Plus className="w-4 h-4"/> Buat Laporan Kehadiran
                            </Button>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Tgl Lapor</TableHead>
                                        <TableHead>Klien / Reg</TableHead>
                                        <TableHead>Keterangan & Status</TableHead>
                                        <TableHead>Bukti</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wajibLaporList.map((wl) => (
                                        <TableRow key={wl.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {new Date(wl.tanggal_lapor).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col min-w-[150px]">
                                                    <span className="font-semibold text-slate-800">{wl.klien?.nama_klien}</span>
                                                    <span className="text-[10px] text-slate-500">Reg: {wl.klien?.nomor_register_lapas}</span>
                                                    <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1"><Phone className="w-2.5 h-2.5"/> {wl.klien?.nomor_telepon || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start max-w-[200px]">
                                                    <span className="text-sm italic text-slate-600 truncate w-full">{wl.keterangan || '-'}</span>
                                                    <Badge className={cn("text-[10px]", 
                                                        wl.status_validasi === 'Valid' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                                    )}>
                                                        {wl.status_validasi === 'Valid' ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <AlertCircle className="w-3 h-3 mr-1"/>}
                                                        {wl.status_validasi || 'Menunggu Validasi'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => setPreviewImage(wl.foto_url)} className="gap-2 h-8 text-blue-600 border-blue-200 hover:bg-blue-50"><Eye className="w-3.5 h-3.5"/> Cek Foto</Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {wl.status_validasi !== 'Valid' ? (
                                                    <Button size="sm" onClick={() => handleValidasiLapor(wl.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1"><CheckCircle2 className="w-4 h-4"/> Validasi</Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" disabled className="text-emerald-600 h-8 gap-1"><CheckCircle2 className="w-4 h-4"/> Disahkan</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {wajibLaporList.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada wajib lapor dari klien yang Anda dampingi.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </Tabs>
          </CardContent>
        </Card>

        {/* DIALOG FORM WAJIB LAPOR PK - DENGAN DESAIN GRID */}
        <Dialog open={openLaporDialog} onOpenChange={(open) => !open && closeLaporDialog()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
                <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Camera className="w-6 h-6 text-emerald-600" /> Form Input Wajib Lapor Klien
                    </DialogTitle>
                    <DialogDescription>
                        Lakukan verifikasi kehadiran klien dan perbarui informasi kontak jika diperlukan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitWajibLapor} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    
                    {/* KOLOM KIRI: DATA & INFORMASI */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-5">Identitas & Kontak</h4>
                            
                            <div className="space-y-5">
                                <div className="grid gap-2">
                                    <Label className="text-slate-600 font-semibold">Pilih Klien Bimbingan <span className="text-red-500">*</span></Label>
                                    <Popover open={openLaporCombo} onOpenChange={setOpenLaporCombo}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={openLaporCombo} className="w-full justify-between bg-slate-50 text-left h-auto py-3 border-slate-200">
                                                {selectedLaporClient ? (
                                                    <div className="flex flex-col items-start overflow-hidden">
                                                        <span className="font-bold text-slate-900 truncate w-full">
                                                            {eligibleLaporClients.find(c => String(c.id_klien) === selectedLaporClient)?.nama_klien}
                                                        </span>
                                                        <span className="text-xs text-slate-500 truncate w-full">
                                                            Reg: {eligibleLaporClients.find(c => String(c.id_klien) === selectedLaporClient)?.nomor_register_lapas}
                                                        </span>
                                                    </div>
                                                ) : "Klik untuk memilih klien..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Cari nama klien Anda..." />
                                                <CommandList>
                                                    <CommandEmpty>Tidak ditemukan klien aktif atas nama Anda.</CommandEmpty>
                                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                                        {eligibleLaporClients.map((c: any) => (
                                                            <CommandItem key={c.id_klien} value={`${c.nama_klien} ${c.nomor_register_lapas}`} onSelect={() => { 
                                                                setSelectedLaporClient(String(c.id_klien)); 
                                                                setLaporTelepon(c.nomor_telepon || ""); // Load telepon otomatis
                                                                setOpenLaporCombo(false); 
                                                            }}>
                                                                <Check className={cn("mr-2 h-4 w-4", selectedLaporClient === String(c.id_klien) ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{c.nama_klien}</span>
                                                                    <span className="text-xs text-muted-foreground">Reg: {c.nomor_register_lapas}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* KOLOM TELEPON - MUNCUL HANYA DI FORM INI */}
                                <div className={cn("grid gap-2 transition-opacity", !selectedLaporClient && "opacity-50 pointer-events-none")}>
                                    <Label className="text-slate-600 font-semibold flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-emerald-600"/> Nomor Telepon Klien Aktif
                                    </Label>
                                    <Input 
                                        type="text" 
                                        value={laporTelepon} 
                                        onChange={(e) => setLaporTelepon(e.target.value.replace(/[^0-9]/g, ''))} 
                                        placeholder="Contoh: 08123456789"
                                        className="bg-slate-50 border-slate-200"
                                    />
                                    <p className="text-[10px] text-slate-400 italic">*Nomor ini akan memperbarui database klien secara otomatis saat disimpan.</p>
                                </div>

                                <div className={cn("grid gap-2 transition-opacity", !selectedLaporClient && "opacity-50 pointer-events-none")}>
                                    <Label className="text-slate-600 font-semibold">Keterangan Aktivitas / Laporan</Label>
                                    <Textarea 
                                        value={laporKeterangan} 
                                        onChange={(e) => setLaporKeterangan(e.target.value)} 
                                        placeholder="Tuliskan aktivitas atau kondisi terkini klien..." 
                                        rows={4}
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: LIVE CAMERA / BUKTI */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-emerald-500 pl-3 mb-5">Bukti Visual Kehadiran</h4>
                            
                            <div className="flex-1 flex flex-col justify-center">
                                {isCameraOpen ? (
                                    <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex flex-col items-center justify-center border-2 border-emerald-500 shadow-inner">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10 px-4">
                                            <Button type="button" size="icon" variant="destructive" className="rounded-full shadow-lg h-12 w-12" onClick={() => setIsCameraOpen(false)}>
                                                <XCircle className="w-6 h-6" />
                                            </Button>
                                            <Button type="button" size="icon" className="rounded-full shadow-lg h-16 w-16 bg-white hover:bg-slate-200 text-emerald-600 border-4 border-emerald-200" onClick={capturePhoto}>
                                                <Focus className="w-8 h-8" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : laporPhotoPreview ? (
                                    <div className="relative border-2 border-emerald-400 bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                                        <img src={laporPhotoPreview} alt="Preview Lapor" className="w-full max-h-[300px] object-cover rounded-md shadow-md mb-4 border border-white" />
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="gap-2 bg-white border-emerald-200 text-emerald-700">
                                                <Camera className="w-4 h-4"/> Ambil Ulang
                                            </Button>
                                            <Button type="button" variant="ghost" onClick={resetLaporPhoto} className="gap-2 text-red-500 hover:bg-red-50">
                                                <XCircle className="w-4 h-4"/> Batalkan Foto
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-8 flex flex-col items-center justify-center gap-4 min-h-[250px] text-center">
                                        <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full">
                                            <Camera className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">Mulai Verifikasi Wajah/Lokasi</p>
                                            <p className="text-xs text-slate-500 px-4">Gunakan kamera perangkat untuk bukti kehadiran yang valid.</p>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-sm">
                                            <Button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!selectedLaporClient}>
                                                <Focus className="w-4 h-4 mr-2" /> Buka Kamera
                                            </Button>
                                            <div className="relative flex-1">
                                                <Button type="button" variant="outline" className="w-full border-slate-300" disabled={!selectedLaporClient}>
                                                    <ImageIcon className="w-4 h-4 mr-2" /> Galeri Foto
                                                </Button>
                                                <Input type="file" accept="image/*" onChange={handleLaporPhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={!selectedLaporClient} />
                                            </div>
                                        </div>
                                        {!selectedLaporClient && <p className="text-[10px] text-red-500 font-medium">Silakan pilih klien terlebih dahulu.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER DI DALAM FORM */}
                    <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                        <Button type="button" variant="outline" onClick={closeLaporDialog}>Batalkan</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" disabled={laporSubmitting || !laporPhoto || isCameraOpen || !selectedLaporClient}>
                            {laporSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Menyimpan...</> : <><CheckCircle2 className="w-4 h-4 mr-2"/> Simpan Laporan Kehadiran</>}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-md p-4">
                <DialogHeader><DialogTitle>Pratinjau Bukti Wajib Lapor</DialogTitle></DialogHeader>
                <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-100 mt-2">
                    <img src={previewImage || ''} alt="Wajib Lapor" className="w-full h-auto object-cover rounded-md" />
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={() => setPreviewImage(null)} variant="outline">Tutup</Button>
                </div>
            </DialogContent>
        </Dialog>

        <PKRegisterDialog isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} schedules={availableSchedules} selectedScheduleId={selectedScheduleId} onSelectSchedule={setSelectedScheduleId} onConfirm={confirmRegisterTPP} />
        <PKDetailDialog isOpen={isDetailOpen} onOpenChange={setIsDetailOpen} task={selectedTask} onRefresh={fetchMyTasksAndLapor} />
      </div>
    </TestPageLayout>
  );
}