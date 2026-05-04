import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, FileText, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return isoString;
  }
};

interface LayananTerdaftarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLitmasDetail: any;
}

export function LayananTerdaftarDialog({ open, onOpenChange, selectedLitmasDetail }: LayananTerdaftarDialogProps) {
  
  const handleOpenDoc = (url: string) => {
    if (!url) return;
    
    // Cek apakah url sudah merupakan full URL (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
    } else {
      // Jika hanya path/nama file, ambil dari bucket 'documents'
      const { data } = supabase.storage.from('documents').getPublicUrl(url);
      window.open(data.publicUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
        <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-orange-500" /> Detail Registrasi Layanan
          </DialogTitle>
        </DialogHeader>
        
        {selectedLitmasDetail ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-orange-500 pl-3 mb-5">Informasi Layanan</h4>
                
                <div className="flex justify-between items-start bg-orange-50/50 p-4 rounded-lg border border-orange-100 mb-5">
                  <div>
                    <p className="text-xs text-orange-600 uppercase font-bold tracking-tighter">Nomor Surat Permintaan</p>
                    <h3 className="text-lg font-mono font-bold text-slate-800">{selectedLitmasDetail.nomor_surat_permintaan}</h3>
                    <p className="text-sm text-slate-600 mt-1">Tanggal: {selectedLitmasDetail.tanggal_surat_permintaan}</p>
                  </div>
                  <Badge className={cn("text-sm px-3 py-1", selectedLitmasDetail.status === 'Selesai' ? "bg-green-600" : "bg-blue-600")}>
                    {selectedLitmasDetail.status || 'New Task'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-y-3 text-sm">
                  <div className="flex border-b border-slate-100 pb-2">
                    <span className="text-slate-500 w-1/3">Jenis Layanan</span>
                    <span className="font-semibold text-blue-700 w-2/3">: {selectedLitmasDetail.jenis_litmas}</span>
                  </div>
                  <div className="flex border-b border-slate-100 pb-2">
                    <span className="text-slate-500 w-1/3">Kategori</span>
                    <span className="capitalize w-2/3">: {selectedLitmasDetail.kategori_layanan || 'Litmas'}</span>
                  </div>
                  <div className="flex border-b border-slate-100 pb-2">
                    <span className="text-slate-500 w-1/3">Tahapan</span>
                    <span className="font-medium text-orange-700 w-2/3">: {selectedLitmasDetail.tahapan_layanan || '-'}</span>
                  </div>
                  <div className="flex border-b border-slate-100 pb-2">
                    <span className="text-slate-500 w-1/3">Petugas PK</span>
                    <span className="font-semibold text-slate-800 w-2/3">: {selectedLitmasDetail.petugas_pk?.nama || 'Belum Ditunjuk'}</span>
                  </div>
                  <div className="flex border-b border-slate-100 pb-2">
                    <span className="text-slate-500 w-1/3">Asal UPT/Bapas</span>
                    <span className="w-2/3">: {selectedLitmasDetail.ref_upt?.nama_upt || selectedLitmasDetail.asal_bapas || '-'}</span>
                  </div>
                  <div className="flex pb-1">
                    <span className="text-slate-500 w-1/3">Waktu Reg.</span>
                    <span className="text-xs text-slate-600 w-2/3 flex items-center gap-1">
                      <Clock className="w-3 h-3"/>: {formatDateTime(selectedLitmasDetail.waktu_registrasi)}
                    </span>
                  </div>
                </div>

                {selectedLitmasDetail.file_surat_permintaan_url && (
                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <Button
                      variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleOpenDoc(selectedLitmasDetail.file_surat_permintaan_url)}
                    >
                      <FileText className="w-4 h-4" /> Buka Dokumen Surat Permintaan
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-5">Data Klien Terkait</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Nama Lengkap</span>
                    <span className="font-semibold block">{selectedLitmasDetail.klien?.nama_klien || '-'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">No. Register Lapas</span>
                    <span className="font-mono font-bold text-blue-600 block">{selectedLitmasDetail.klien?.nomor_register_lapas || '-'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Kategori & Usia</span>
                    <span className="block flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-50">{selectedLitmasDetail.klien?.kategori_usia || '-'}</Badge>
                      {selectedLitmasDetail.klien?.usia ? `${selectedLitmasDetail.klien.usia} Thn` : '-'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">No. Telepon</span>
                    <span className="text-green-700 font-semibold block">{selectedLitmasDetail.klien?.nomor_telepon || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 h-full">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
                <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-3">
                  <History className="w-5 h-5 text-blue-600"/> Riwayat Proses Layanan
                </h4>
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                  {[
                    { date: selectedLitmasDetail?.waktu_registrasi, label: "Registrasi & Penunjukan PK", color: "bg-green-500", text: "text-slate-800" },
                    { date: selectedLitmasDetail?.waktu_upload_surat_tugas, label: "PK: Upload Surat Tugas", color: "bg-green-500", text: "text-slate-800" },
                    { date: selectedLitmasDetail?.waktu_upload_laporan, label: "PK: Upload Laporan", color: "bg-green-500", text: "text-slate-800" },
                    { date: selectedLitmasDetail?.waktu_verifikasi_anev, label: "Anev: Verifikasi & Approval", color: "bg-green-500", text: "text-slate-800" },
                    { date: selectedLitmasDetail?.waktu_sidang_tpp || selectedLitmasDetail?.tanggal_sidang_tpp, label: "TPP: Sidang Dilaksanakan", color: "bg-purple-600", text: "text-slate-800" },
                    { date: selectedLitmasDetail?.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" },
                  ].map((item, idx) => (
                    <div key={idx} className="ml-8 relative group">
                      <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${item.date ? item.color : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                      <div className={!item.date ? 'opacity-50 grayscale' : ''}>
                        <p className={`text-sm font-bold ${item.text}`}>{item.label}</p>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                          {item.date ? formatDateTime(item.date) : 'Menunggu Proses'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-10">
            <span className="text-slate-400">Tidak ada data.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}