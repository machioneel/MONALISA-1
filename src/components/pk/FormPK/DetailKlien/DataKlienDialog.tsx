import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, UserCheck, MapPin, ShieldCheck, Layers, FileText, Clock, Phone } from 'lucide-react';

// Fungsi untuk memformat tanggal dan waktu
const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
};

// Mendefinisikan tipe data untuk props (parameter) yang diterima komponen
interface DataKlienDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: any; // Berisi data profil, penjamin, dan layanan_list
}

export function DataKlienDialog({ isOpen, onOpenChange, clientData }: DataKlienDialogProps) {
  // Jika tidak ada data yang dilempar, jangan render (tampilkan) apa-apa
  if (!clientData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
        
        {/* HEADER DIALOG */}
        <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {clientData.nama_klien}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-xs mt-1 text-slate-500">
                        Register: {clientData.nomor_register_lapas || '-'} | NIK: {clientData.nik_klien || '-'}
                    </DialogDescription>
                </div>
            </div>
        </DialogHeader>

        {/* KONTEN UTAMA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            
            {/* Kolom Kiri: Profil & Penjamin */}
            <div className="space-y-4 lg:col-span-1">
                
                {/* Card Data Pribadi */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                            <UserCheck className="w-4 h-4 text-blue-600"/> Data Pribadi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Kategori</span>
                            <span className="font-semibold text-slate-800">{clientData.kategori_usia || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Agama</span>
                            <span className="font-medium text-slate-800">{clientData.agama || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">TTL</span>
                            <span className="font-medium text-slate-800 text-right">{clientData.tempat_lahir || '-'}, {clientData.tanggal_lahir || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                            <span className="text-slate-500">Pendidikan</span>
                            <span className="font-medium text-slate-800 text-right">{clientData.pendidikan || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Pekerjaan</span>
                            <span className="font-medium text-slate-800 text-right">{clientData.pekerjaan || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Card Kontak & Domisili */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                            <MapPin className="w-4 h-4 text-green-600"/> Kontak & Domisili
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400"/>
                            <span className="font-semibold text-green-700">{clientData.nomor_telepon || '-'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Alamat Lengkap:</p>
                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                {clientData.alamat || '-'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Card Data Penjamin (Ditampilkan jika data penjamin ada) */}
                {clientData.penjamin && clientData.penjamin.length > 0 && (
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 pb-3 border-b">
                            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                                <ShieldCheck className="w-4 h-4 text-purple-600"/> Data Penjamin
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 text-sm">
                            {clientData.penjamin.map((p: any, idx: number) => (
                                <div key={idx} className="bg-purple-50/50 p-3 rounded border border-purple-100 space-y-1">
                                    <p className="font-bold text-purple-900">{p.nama_penjamin}</p>
                                    <Badge variant="outline" className="text-[10px] bg-white text-purple-700">{p.hubungan_klien}</Badge>
                                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-2">
                                        <Phone className="w-3 h-3"/> {p.nomor_telepon || '-'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Kolom Kanan: Riwayat Layanan */}
            <div className="space-y-4 lg:col-span-2">
                <Card className="shadow-sm border-slate-200 h-full">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                            <Layers className="w-4 h-4 text-blue-600"/> Riwayat & Daftar Layanan Klien
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {clientData.layanan_list && clientData.layanan_list.length > 0 ? (
                            clientData.layanan_list.map((layanan: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
                                    <div className="bg-blue-50 p-3 rounded-lg flex flex-col items-center justify-center shrink-0 border border-blue-100">
                                        <FileText className="w-5 h-5 text-blue-600 mb-1" />
                                        <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">{layanan.kategori_layanan}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-bold text-slate-800">{layanan.jenis_litmas || 'Layanan Reguler'}</h5>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Reg: {formatDateTime(layanan.waktu_registrasi)}
                                                </p>
                                            </div>
                                            <Badge variant={layanan.status === 'Selesai' ? 'default' : 'outline'} className="text-[10px]">
                                                {layanan.status || 'New Task'}
                                            </Badge>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">Petugas PK</span>
                                                <span className="font-medium text-slate-700">{layanan.nama_pk}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block mb-0.5">ID Layanan</span>
                                                <span className="font-mono text-slate-600">#{layanan.id_layanan}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 italic">
                                Belum ada riwayat layanan terdaftar.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* FOOTER DIALOG */}
        <div className="flex justify-end pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup Profil</Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}