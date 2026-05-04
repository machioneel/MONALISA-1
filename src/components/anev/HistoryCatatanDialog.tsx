import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageSquare, User, FileText, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Fungsi format tanggal agar rapi
const formatDateTime = (isoString: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
  }) + ' WIB';
};

interface HistoryCatatanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
}

export function HistoryCatatanDialog({ isOpen, onOpenChange, task }: HistoryCatatanDialogProps) {
  if (!task) return null;

  // Fungsi untuk membuka dokumen di tab baru
  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Riwayat Catatan & Dokumen
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Melihat riwayat komunikasi dan dokumen terkait layanan <span className="font-semibold text-slate-700">#{task.id_litmas || task.id_layanan}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          
          {/* 1. KOTAK CATATAN PK */}
          <div className="bg-white border border-blue-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Catatan dari PK</h5>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDateTime(task.waktu_upload_laporan)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {task.pk_notes ? task.pk_notes : <span className="italic text-slate-400">PK tidak memberikan catatan pada unggahan ini.</span>}
            </p>
          </div>

          {/* 2. KOTAK CATATAN ANEV */}
          <div className="bg-white border border-amber-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-1.5 rounded-full">
                  <User className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Catatan ANEV / Keputusan Revisi</h5>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDateTime(task.waktu_verifikasi_anev || task.reviewed_at)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {task.anev_notes || task.catatan_revisi ? (task.anev_notes || task.catatan_revisi) : <span className="italic text-slate-400">Belum ada catatan atau instruksi revisi dari ANEV.</span>}
            </p>
          </div>

          {/* 3. KOTAK DOKUMEN TERKAIT (Untuk Perbandingan) */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h5 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-slate-500" /> Dokumen Referensi Saat Ini
            </h5>
            
            <div className="space-y-3">
              {/* Dokumen Laporan Hasil */}
              {task.hasil_litmas_url ? (
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100 hover:bg-blue-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded text-blue-600"><FileText className="w-4 h-4"/></div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Laporan Hasil Litmas</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Diunggah: {formatDateTime(task.waktu_upload_laporan)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-blue-700 border-blue-200 bg-white" onClick={() => openDoc(task.hasil_litmas_url)}>
                    <ExternalLink className="w-3 h-3 mr-1.5" /> Buka
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic px-2">Laporan Hasil Litmas belum diunggah.</p>
              )}

              {/* Dokumen Surat Tugas */}
              {task.surat_tugas_signed_url && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-200 p-2 rounded text-slate-600"><FileText className="w-4 h-4"/></div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Surat Tugas PK</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Diunggah: {formatDateTime(task.waktu_upload_surat_tugas)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openDoc(task.surat_tugas_signed_url)}>
                    Buka
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic text-center">
              Dokumen di atas adalah versi terbaru yang ada di dalam database.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}