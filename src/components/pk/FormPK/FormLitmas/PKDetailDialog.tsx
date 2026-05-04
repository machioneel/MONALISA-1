import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, History, Calendar, Clock, Upload, CheckCircle2, AlertCircle, Phone, ClipboardList, InfoIcon, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnevSelector } from "./AnevSelector"; 
import { FileReupload } from "./FileReupload"; 

const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const formatSidangDate = (isoString: string) => {
    if (!isoString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); 
    return { dateStr, timeStr };
};

interface PKDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onRefresh?: () => void;
}

export function PKDetailDialog({ isOpen, onOpenChange, task, onRefresh }: PKDetailDialogProps) {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'detail' | 'riwayat'>('detail');
  const [uploading, setUploading] = useState(false);
  const [fileLaporan, setFileLaporan] = useState<File | null>(null);
  const [selectedAnevId, setSelectedAnevId] = useState<string>("");
  const [anevName, setAnevName] = useState<string>(""); 
  const [pkName, setPkName] = useState<string>(""); 
  const [catatanPk, setCatatanPk] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingAnevId = task?.assigned_anev_id || task?.id_anev;
  const isAnevAssigned = !!existingAnevId;
  const currentId = task?.id_layanan || task?.id_litmas;

  useEffect(() => {
    const fetchNames = async () => {
        setAnevName("");
        if (existingAnevId && isOpen) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select(`employees (nama)`)
                    .eq('id', existingAnevId)
                    .single();
                
                if (!error && data?.employees?.nama) {
                    // @ts-ignore
                    setAnevName(data.employees.nama);
                } else {
                    setAnevName("Nama Tidak Ditemukan");
                }
            } catch (err) {
                console.error("Gagal memuat nama Anev", err);
            }
        }

        setPkName("");
        if (task?.nama_pk && isOpen) {
            try {
                const { data: pkData } = await supabase
                    .from('petugas_pk')
                    .select('nama')
                    .or(`id.eq.${task.nama_pk},user_id.eq.${task.nama_pk},employee_id.eq.${task.nama_pk}`)
                    .maybeSingle();

                if (pkData?.nama) {
                    setPkName(pkData.nama);
                } else {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('employees(nama)')
                        .eq('id', task.nama_pk)
                        .maybeSingle();
                    
                    // @ts-ignore
                    if (userData?.employees?.nama) {
                        // @ts-ignore
                        setPkName(userData.employees.nama);
                    }
                }
            } catch (err) {
                console.error("Gagal memuat nama PK", err);
            }
        }
    };

    if (isOpen) {
        fetchNames();
        setCatatanPk(task?.pk_notes || "");
        setActiveTab('detail'); // Reset tab saat modal dibuka
    }
  }, [isOpen, existingAnevId, task?.nama_pk]);

  if (!task) return null;

  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const handleUploadLaporan = async () => {
    if (!fileLaporan) {
      toast({ title: "File Kosong", description: "Mohon pilih file laporan hasil litmas (PDF/DOCX).", variant: "destructive" });
      return;
    }

    const targetAnevId = isAnevAssigned ? existingAnevId : selectedAnevId;

    if (!targetAnevId) {
      toast({ title: "Anev Belum Ditunjuk", description: "Wajib memilih Anev Verifikator sebelum mengirim.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = fileLaporan.name.split('.').pop();
      const fileName = `hasil_litmas/${task.tabel_sumber || 'litmas'}_${currentId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, fileLaporan);
      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);

      const updatePayload: any = { 
          status: 'Review', 
          hasil_litmas_url: fileName, 
          waktu_upload_laporan: new Date().toISOString(),
          pk_notes: catatanPk 
      };
      if (!isAnevAssigned) updatePayload.assigned_anev_id = targetAnevId;

      const tableName = task.tabel_sumber || 'litmas';
      const pkColumn = `id_${tableName}`;
      const { error: updateError } = await supabase.from(tableName).update(updatePayload).eq(pkColumn, currentId);
      
      if (updateError) throw new Error(`Gagal update database: ${updateError.message}`);

      try {
          const { data: { user } } = await supabase.auth.getUser();
          let currentPkName = "Petugas PK";
          
          if (user) {
              //@ts-ignore
              const { data: pkData } = await supabase.from('petugas_pk').select('nama').eq('user_id', user.id).maybeSingle();
              if (pkData) currentPkName = pkData.nama;
              else {
                  //@ts-ignore
                  const { data: empData } = await supabase.from('users').select('employees(nama)').eq('id', user.id).maybeSingle();
                  //@ts-ignore
                  if (empData?.employees?.nama) currentPkName = empData.employees.nama;
              }
          }

          const { error: funcError } = await supabase.functions.invoke('notify-anev', {
              body: { id_anev: targetAnevId, nama_pk: currentPkName, nama_klien: task?.klien?.nama_klien || "Tanpa Nama", jenis_litmas: task?.jenis_litmas || "Laporan Bimbingan" }
          });

          if (funcError) {
              toast({ variant: "default", className: "bg-yellow-50 border-yellow-200 text-yellow-800", title: "Laporan Terupload (WA Gagal)", description: "Data tersimpan, namun gagal mengirim notifikasi WA ke Anev." });
          } else {
              toast({ title: "Sukses!", description: isAnevAssigned ? "Laporan Revisi berhasil dikirim ke Anev." : "Laporan dikirim dan Anev telah dinotifikasi." });
          }
      } catch (notifErr) { console.error("Error logic notifikasi:", notifErr); }
      
      setFileLaporan(null);
      setSelectedAnevId("");
      setCatatanPk("");
      onOpenChange(false);
      if (onRefresh) onRefresh();

    } catch (error: any) {
      toast({ title: "Gagal Memproses", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const { dateStr: sidangDate, timeStr: sidangTime } = formatSidangDate(task?.jadwal?.tanggal_sidang || task?.waktu_sidang_tpp);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
            
            {/* HEADER */}
            <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mr-6">
                    <div className="space-y-1">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <ClipboardList className="w-6 h-6 text-blue-600"/> Detail Tugas Layanan & Bimbingan
                        </DialogTitle>
                        <div className="flex items-center mt-1">
                            <DialogDescription className="text-xs m-0 p-0 inline">
                                ID: <span className="font-mono font-medium text-slate-700">#{currentId}</span> • 
                                No. Surat: <span className="font-mono font-medium text-slate-700">{task?.nomor_surat_permintaan || '-'}</span>
                            </DialogDescription>
                            <Badge variant="outline" className="ml-2 bg-slate-100 text-[10px] text-slate-500">{task?.tabel_sumber?.toUpperCase() || 'LITMAS'}</Badge>
                        </div>
                    </div>
                    <Badge variant={task?.status === 'Selesai' ? 'default' : 'outline'} className="text-sm px-3 py-1 uppercase tracking-wide">
                        {task?.status}
                    </Badge>
                </div>
            </DialogHeader>

            {/* TAB NAVIGATION */}
            <div className="flex w-full bg-slate-100 p-1 rounded-lg mt-4 mb-4">
                <button
                    onClick={() => setActiveTab('detail')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-all rounded-md ${
                        activeTab === 'detail'
                            ? 'bg-white text-slate-800 shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-slate-700 font-medium'
                    }`}
                >
                    <ClipboardList className="w-4 h-4" /> Detail & Dokumen
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-all rounded-md ${
                        activeTab === 'riwayat'
                            ? 'bg-white text-slate-800 shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-slate-700 font-medium'
                    }`}
                >
                    <History className="w-4 h-4" /> Riwayat Proses
                </button>
            </div>
            
            {/* TAB CONTENT: DETAIL & DOKUMEN */}
            {activeTab === 'detail' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    
                    {/* KOLOM KIRI */}
                    <div className="space-y-6">

                        {/* 1. NAMA PK */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-left font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Nama PK</Label>
                                <div className="col-span-3">
                                    <p className="text-sm font-semibold text-slate-800">{task?.petugas_pk?.nama || pkName || 'Belum di-assign'}</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. CATATAN ANEV / REVISI */}
                        {task?.anev_notes && (
                            <Alert className="bg-amber-50 border-amber-200 shadow-sm">
                                <InfoIcon className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800 font-semibold">Catatan / Evaluasi dari ANEV</AlertTitle>
                                <AlertDescription className="text-amber-700 mt-1">
                                    {task.anev_notes}
                                </AlertDescription>
                            </Alert>
                        )}

                        {task?.status === 'Revision' && task?.catatan_revisi && (
                            <Alert className="bg-amber-50 border-amber-200 shadow-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800 font-semibold">Catatan Revisi Sebelumnya</AlertTitle>
                                <AlertDescription className="text-amber-700 mt-1">
                                    {task.catatan_revisi}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* 3. UPLOAD LAPORAN */}
                        {['On Progress', 'Revision'].includes(task?.status) && !task?.hasil_litmas_url && (
                            <div className="border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(prev => !prev)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-blue-700 shrink-0"/>
                                        <span className="text-sm font-bold text-blue-900">
                                            {isAnevAssigned ? "Upload Revisi Laporan" : "Upload Laporan Hasil / Dokumen Bimbingan"}
                                        </span>
                                        {fileLaporan && (
                                            <span className="text-[10px] bg-blue-200 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                                                File dipilih
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${isUploadOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isUploadOpen && (
                                    <div className="bg-blue-50/60 px-4 pb-4 pt-3 space-y-3 border-t border-blue-200">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                                                    Anev Verifikator {!isAnevAssigned && <span className="text-red-500">*</span>}
                                                </Label>
                                                {!isAnevAssigned ? (
                                                    <>
                                                        <div className="bg-white rounded-md border border-blue-200">
                                                            <AnevSelector selectedAnevId={selectedAnevId} onSelect={setSelectedAnevId} />
                                                        </div>
                                                        <p className="text-[10px] text-blue-500 italic">*Sekali dipilih tidak dapat diubah.</p>
                                                    </>
                                                ) : (
                                                    <div className="bg-blue-100/60 px-3 py-2 rounded-md border border-blue-200 text-sm font-medium text-blue-800 h-9 flex items-center">
                                                        {anevName || "Memuat..."}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-blue-900 text-sm font-semibold">
                                                    File Laporan (PDF) <span className="text-red-500">*</span>
                                                </Label>
                                                <div
                                                    className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[160px]
                                                    ${isDragging
                                                        ? 'bg-blue-200 border-blue-500 scale-[1.02]'
                                                        : fileLaporan
                                                        ? 'bg-blue-100 border-blue-400'
                                                        : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300'}
                                                    `}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                    }}
                                                    onDragLeave={() => setIsDragging(false)}
                                                    onDrop={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                    const file = e.dataTransfer.files?.[0];
                                                    if (file) setFileLaporan(file);
                                                    }}
                                                >
                                                    <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) =>
                                                        e.target.files && setFileLaporan(e.target.files[0])
                                                    }
                                                    />

                                                    {fileLaporan ? (
                                                    <div className="text-blue-700 font-semibold text-sm flex items-center gap-2 px-2">
                                                        <FileText className="w-4 h-4 shrink-0" />
                                                        <span className="truncate max-w-[180px]">
                                                        {fileLaporan.name}
                                                        </span>
                                                    </div>
                                                    ) : isDragging ? (
                                                    <div className="text-blue-600 font-semibold text-sm">
                                                        Lepaskan file di sini...
                                                    </div>
                                                    ) : (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold text-blue-600 block">
                                                        Klik atau Drag File
                                                        </span>
                                                        <span className="text-[10px] text-blue-400">
                                                        PDF / DOC, maks 5MB
                                                        </span>
                                                    </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-end gap-3 pt-1 border-t border-blue-200">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">Catatan untuk ANEV (Opsional)</Label>
                                                <Textarea
                                                    placeholder="Keterangan perbaikan atau catatan untuk ANEV..."
                                                    className="bg-white border-blue-200 min-h-[60px] text-xs resize-none"
                                                    value={catatanPk}
                                                    onChange={(e) => setCatatanPk(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                onClick={handleUploadLaporan}
                                                disabled={uploading}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0 h-[60px] px-4"
                                            >
                                                {uploading ? (
                                                    "Mengirim..."
                                                ) : (
                                                    <span className="flex flex-col items-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4"/>
                                                        <span className="text-[10px] leading-none">Kirim ke Anev</span>
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. DATA KLIEN & LAYANAN */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-5">Data Klien & Layanan</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                                    <p className="font-semibold text-slate-800 text-base">{task?.klien?.nama_klien || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">No. Register</span> 
                                    <p className="font-mono text-slate-700 bg-white inline-block px-2 py-0.5 rounded border">{task?.klien?.nomor_register_lapas || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jenis Layanan</span> 
                                    <p className="font-medium text-slate-700">{task?.jenis_litmas || 'Bimbingan Lanjutan'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Usia</span> 
                                    <Badge variant="secondary" className="font-normal text-xs">{task?.klien?.kategori_usia || '-'}</Badge>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal Permintaan</span> 
                                    <p className="font-medium text-slate-700">{task?.asal_bapas || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Anev (Verifikator)</span> 
                                    <p className={`font-medium ${isAnevAssigned ? 'text-blue-700' : 'text-slate-400'}`}>
                                        {isAnevAssigned ? (anevName || "Memuat nama...") : "Belum Ditunjuk"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 5. DATA PENJAMIN */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-emerald-500 pl-3 mb-5">Data Penjamin (Kontak Darurat)</h4>
                            {task?.klien?.penjamin && task.klien.penjamin.length > 0 ? (
                                <div className="space-y-4">
                                    {task.klien.penjamin.map((p: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-emerald-50/50 p-4 rounded-md border border-emerald-100">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Penjamin</span>
                                                <p className="font-semibold text-slate-800">{p.nama_penjamin || '-'}</p>
                                                <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                    {p.hubungan_klien?.replace('_', ' ').toUpperCase() || '-'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nomor Telepon</span>
                                                <p className="font-bold text-emerald-700 flex items-center gap-1">
                                                    <Phone className="w-3 h-3"/> {p.nomor_telepon || '-'}
                                                </p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alamat Lengkap</span>
                                                <p className="text-slate-700">{p.alamat || '-'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-center">
                                    <p className="text-xs text-slate-500 italic">Belum ada data penjamin yang terdaftar pada klien ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-6">
                        
                        {/* A. WIDGET JADWAL */}
                        {task?.jadwal ? (
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Calendar className="w-24 h-24"/></div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-4">Jadwal Sidang TPP</h4>
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-indigo-200"/>
                                    <span className="text-lg font-bold">{sidangDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-200"/>
                                    <span className="text-sm font-medium">{sidangTime} WIB</span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/20 text-xs text-indigo-100">
                                    Jenis Sidang: {task?.jadwal?.jenis_sidang || 'Rutin'}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-200 border-dashed">
                                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2"/>
                                <p className="text-sm font-medium text-slate-500">Belum Terjadwal Sidang TPP</p>
                                <p className="text-xs text-slate-400">Menunggu persetujuan Anev</p>
                            </div>
                        )}

                        {/* B. DAFTAR DOKUMEN & RE-UPLOAD */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-800">
                                <ExternalLink className="w-4 h-4 text-blue-600"/> Dokumen Terkait
                            </h4>
                            <div className="space-y-4">
                                
                                {/* 1. SURAT PERMINTAAN */}
                                {task?.file_surat_permintaan_url ? (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-100 p-2 rounded text-emerald-600"><FileText className="w-4 h-4"/></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Surat Permintaan</p>
                                                <p className="text-[10px] text-slate-400">Dari Lapas/Bapas</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => openDoc(task.file_surat_permintaan_url)}>Lihat</Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">Surat permintaan belum diunggah.</p>
                                )}

                                {/* 2. SURAT TUGAS */}
                                {task?.surat_tugas_signed_url ? (
                                    <div className="flex flex-col p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-red-100 p-2 rounded text-red-600"><FileText className="w-4 h-4"/></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">Surat Tugas (Signed)</p>
                                                    <p className="text-[10px] text-slate-400">Uploaded: {formatDateTime(task.waktu_upload_surat_tugas)}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => openDoc(task.surat_tugas_signed_url)}>Lihat</Button>
                                        </div>
                                        
                                        {task?.status !== 'Selesai' && (
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase">Re-upload Surat Tugas</p>
                                                <FileReupload 
                                                    tableName={task.tabel_sumber || 'litmas'}
                                                    primaryKeyColumn={`id_${task.tabel_sumber || 'litmas'}`}
                                                    recordId={currentId}
                                                    targetColumn="surat_tugas_signed_url"
                                                    bucketName="documents"
                                                    onSuccess={onRefresh}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">Surat tugas belum diupload.</p>
                                )}

                                {/* 3. HASIL LITMAS */}
                                {task?.hasil_litmas_url ? (
                                    <div className="flex flex-col p-3 bg-slate-50 rounded border border-slate-100 hover:bg-slate-100 transition">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded text-blue-600"><FileText className="w-4 h-4"/></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">Laporan Dokumen / Litmas</p>
                                                    <p className="text-[10px] text-slate-400">Uploaded: {formatDateTime(task.waktu_upload_laporan)}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => openDoc(task.hasil_litmas_url)}>Lihat</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic px-2">Laporan dokumen belum diupload.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: RIWAYAT PROSES */}
            {activeTab === 'riwayat' && (
                <div className="mt-4">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
                        <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-3">
                            <History className="w-4 h-4 text-blue-600"/> Riwayat Proses Lengkap
                        </h4>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                            {[
                              { date: task?.waktu_registrasi, label: "Registrasi & Penunjukan PK", color: "bg-green-500", text: "text-slate-800" },
                              { date: task?.waktu_upload_surat_tugas, label: "PK: Upload Surat Tugas", color: "bg-green-500", text: "text-slate-800" },
                              { date: task?.waktu_upload_laporan, label: "PK: Upload Laporan / Dokumen", color: "bg-green-500", text: "text-slate-800" },
                              { date: task?.waktu_verifikasi_anev, label: "Anev: Verifikasi & Approval", color: "bg-green-500", text: "text-slate-800" },
                              { date: task?.waktu_sidang_tpp || (task?.jadwal ? new Date(task.jadwal.tanggal_sidang).toISOString() : null), label: "TPP: Sidang Dilaksanakan", color: "bg-purple-600", text: "text-slate-800" },
                              { date: task?.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" }
                            ].map((item, idx) => (
                              <div key={idx} className="ml-8 relative group">
                                  <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300
                                      ${item.date ? item.color : 'bg-slate-200 group-hover:bg-slate-300'}
                                  `}></div>
                                  <div className={!item.date ? 'opacity-50 grayscale' : ''}>
                                      <p className={`text-sm font-bold ${item.text}`}>{item.label}</p>
                                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                          {item.date ? formatDateTime(item.date) : 'Belum dilaksanakan'}
                                      </p>
                                  </div>
                              </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="p-4 border-t flex justify-end shrink-0 mt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            </div>
        </DialogContent>
    </Dialog>
  );
}