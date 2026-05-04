import { 
  User, UserCheck, History, AlertCircle, Gavel, Clock, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";

// ─── Helper ──────────────────────────────────────────────────────────────────
const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface DataKlienDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailData: any | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function DataKlienDialog({ open, onOpenChange, detailData }: DataKlienDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
        <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Informasi Klien</DialogTitle>
              <DialogDescription>Data terintegrasi dan riwayat perubahan sistem.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {detailData ? (
          <Tabs defaultValue="klien" className="mt-4">
            {/* Sub-Tab Navigation */}
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100/80 rounded-xl mb-4">
              <TabsTrigger value="klien" className="py-2 text-sm">
                <User className="w-3.5 h-3.5 mr-1.5" />Data Klien
              </TabsTrigger>
              <TabsTrigger value="penjamin" className="py-2 text-sm">
                <UserCheck className="w-3.5 h-3.5 mr-1.5" />Penjamin
              </TabsTrigger>
              <TabsTrigger value="log" className="py-2 text-sm">
                <History className="w-3.5 h-3.5 mr-1.5" />Log Aktivitas
              </TabsTrigger>
            </TabsList>

            {/* ─────────── SUB-TAB: DATA KLIEN ─────────── */}
            <TabsContent value="klien">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Kolom Kiri */}
                <div className="space-y-4">

                  {/* Identitas Utama */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-4">
                      Identitas Utama
                    </h4>
                    <div className="grid grid-cols-3 gap-y-3 text-sm">
                      <span className="text-slate-500">Nama Lengkap</span>
                      <span className="col-span-2 font-semibold">: {detailData?.nama_klien || '-'}</span>

                      <span className="text-slate-500">Nama Alias</span>
                      <span className="col-span-2">
                        : {detailData?.nama_alias && detailData.nama_alias.filter((n: string) => n.trim()).length > 0
                            ? detailData.nama_alias.filter((n: string) => n.trim()).join(', ')
                            : '-'}
                      </span>

                      <span className="text-slate-500">NIK</span>
                      <span className="col-span-2 font-mono">: {detailData?.nik_klien || '-'}</span>

                      <span className="text-slate-500">No. Register</span>
                      <span className="col-span-2 font-mono text-blue-600 font-bold">: {detailData?.nomor_register_lapas || '-'}</span>

                      <span className="text-slate-500">Jenis Kelamin</span>
                      <span className="col-span-2">
                        : {detailData?.jenis_kelamin === 'L' ? 'Laki-laki' : detailData?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </span>

                      <span className="text-slate-500">Tempat Lahir</span>
                      <span className="col-span-2">: {detailData?.tempat_lahir || '-'}</span>

                      <span className="text-slate-500">Tanggal Lahir</span>
                      <span className="col-span-2">: {detailData?.tanggal_lahir || '-'}</span>

                      <span className="text-slate-500">Usia / Kategori</span>
                      <span className="col-span-2 flex items-center gap-2">
                        : {detailData?.usia || '-'} Tahun
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {detailData?.kategori_usia || '-'}
                        </Badge>
                      </span>

                      <span className="text-slate-500">Kewarganegaraan</span>
                      <span className="col-span-2">: {detailData?.kewarganegaraan || '-'}</span>

                      <span className="text-slate-500">Agama</span>
                      <span className="col-span-2">: {detailData?.agama || '-'}</span>

                      <span className="text-slate-500">Status Perkawinan</span>
                      <span className="col-span-2">: {detailData?.status_perkawinan || '-'}</span>

                      <span className="text-slate-500">Residivis</span>
                      <span className="col-span-2">
                        : {detailData?.residivis
                            ? <Badge variant="outline" className={cn(
                                detailData.residivis === 'Ya'
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              )}>{detailData.residivis}</Badge>
                            : '-'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Kolom Kanan */}
                <div className="space-y-4">

                  {/* Pendidikan & Pekerjaan */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-amber-500 pl-3 mb-4">
                      Pendidikan & Pekerjaan
                    </h4>
                    <div className="grid grid-cols-3 gap-y-3 text-sm">
                      <span className="text-slate-500">Pendidikan</span>
                      <span className="col-span-2">: {detailData?.pendidikan || '-'}</span>

                      <span className="text-slate-500">Pekerjaan</span>
                      <span className="col-span-2">: {detailData?.pekerjaan || '-'}</span>

                      <span className="text-slate-500">Minat / Bakat</span>
                      <span className="col-span-2">: {detailData?.minat_bakat || '-'}</span>
                    </div>
                  </div>

                  {/* Kontak & Domisili */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-green-500 pl-3 mb-4">
                      Kontak & Domisili
                    </h4>
                    <div className="grid grid-cols-3 gap-y-3 text-sm">
                      <span className="text-slate-500">No. Telepon</span>
                      <span className="col-span-2 font-semibold text-green-700">: {detailData?.nomor_telepon || '-'}</span>

                      <span className="text-slate-500">Kelurahan</span>
                      <span className="col-span-2">: {detailData?.kelurahan || '-'}</span>

                      <span className="text-slate-500">Kecamatan</span>
                      <span className="col-span-2">: {detailData?.kecamatan || '-'}</span>

                      <span className="text-slate-500 flex items-start pt-0.5">Alamat Lengkap</span>
                      <span className="col-span-2 text-xs leading-relaxed italic">: {detailData?.alamat || '-'}</span>
                    </div>
                  </div>

                  {/* Ringkasan Perkara */}
                  {detailData?.litmas && detailData.litmas.length > 0 &&
                  detailData.litmas[0]?.perkara && detailData.litmas[0].perkara.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-red-500 pl-3 mb-4">
                        Ringkasan Perkara
                      </h4>
                      <div className="space-y-2">
                        {detailData.litmas[0].perkara.map((p: any, idx: number) => (
                          <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Gavel className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span className="font-bold text-red-800">Pasal {p.pasal}</span>
                              {p.juncto && <span className="text-red-500">Jo. {p.juncto}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-5 text-slate-600">
                              <span>Pidana: <span className="font-medium text-slate-800">{p.tindak_pidana || '-'}</span></span>
                              <span>Vonis: <span className="font-medium text-slate-800">{p.vonis_pidana || '-'}</span></span>
                              <span>No. Putusan: <span className="font-medium text-slate-800">{p.nomor_putusan || '-'}</span></span>
                              <span>Ekspirasi: <span className="font-medium text-red-700">{p.tanggal_ekspirasi || '-'}</span></span>
                              {p.uang_pengganti && Number(p.uang_pengganti) > 0 && (
                                <span className="col-span-2">
                                  Uang Pengganti:{' '}
                                  <span className="font-medium text-orange-700">
                                    Rp {Number(p.uang_pengganti).toLocaleString('id-ID')}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ─────────── SUB-TAB: PENJAMIN ─────────── */}
            <TabsContent value="penjamin">
              {detailData?.penjamin && detailData.penjamin.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Kolom Kiri: Identitas Penjamin */}
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-purple-500 pl-3 mb-4">
                        Identitas Penjamin
                      </h4>
                      <div className="grid grid-cols-3 gap-y-3 text-sm">
                        <span className="text-slate-500">Nama Penjamin</span>
                        <span className="col-span-2 font-semibold">: {detailData.penjamin[0].nama_penjamin || '-'}</span>

                        <span className="text-slate-500">NIK Penjamin</span>
                        <span className="col-span-2 font-mono">: {detailData.penjamin[0].nik_penjamin || '-'}</span>

                        <span className="text-slate-500">Hubungan</span>
                        <span className="col-span-2">
                          : {detailData.penjamin[0].hubungan_klien
                              ? <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  {detailData.penjamin[0].hubungan_klien}
                                </Badge>
                              : '-'}
                        </span>

                        <span className="text-slate-500">Jenis Kelamin</span>
                        <span className="col-span-2">
                          : {detailData.penjamin[0].jenis_kelamin === 'L' ? 'Laki-laki'
                              : detailData.penjamin[0].jenis_kelamin === 'P' ? 'Perempuan'
                              : '-'}
                        </span>

                        <span className="text-slate-500">Tempat Lahir</span>
                        <span className="col-span-2">: {detailData.penjamin[0].tempat_lahir || '-'}</span>

                        <span className="text-slate-500">Tanggal Lahir</span>
                        <span className="col-span-2">: {detailData.penjamin[0].tanggal_lahir || '-'}</span>

                        <span className="text-slate-500">Usia</span>
                        <span className="col-span-2">
                          : {detailData.penjamin[0].usia ? `${detailData.penjamin[0].usia} Tahun` : '-'}
                        </span>

                        <span className="text-slate-500">Agama</span>
                        <span className="col-span-2">: {detailData.penjamin[0].agama || '-'}</span>
                      </div>
                    </div>

                    {/* Pendidikan & Pekerjaan Penjamin */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-amber-500 pl-3 mb-4">
                        Pendidikan & Pekerjaan
                      </h4>
                      <div className="grid grid-cols-3 gap-y-3 text-sm">
                        <span className="text-slate-500">Pendidikan</span>
                        <span className="col-span-2">: {detailData.penjamin[0].pendidikan || '-'}</span>

                        <span className="text-slate-500">Pekerjaan</span>
                        <span className="col-span-2">: {detailData.penjamin[0].pekerjaan || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Kontak & Domisili Penjamin */}
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-green-500 pl-3 mb-4">
                        Kontak & Domisili
                      </h4>
                      <div className="grid grid-cols-3 gap-y-3 text-sm">
                        <span className="text-slate-500">No. Telepon</span>
                        <span className="col-span-2 font-semibold text-green-700">
                          : {detailData.penjamin[0].nomor_telepon || '-'}
                        </span>

                        <span className="text-slate-500">Kelurahan</span>
                        <span className="col-span-2">: {detailData.penjamin[0].kelurahan || '-'}</span>

                        <span className="text-slate-500">Kecamatan</span>
                        <span className="col-span-2">: {detailData.penjamin[0].kecamatan || '-'}</span>

                        <span className="text-slate-500 flex items-start pt-0.5">Alamat Lengkap</span>
                        <span className="col-span-2 text-xs leading-relaxed italic">
                          : {detailData.penjamin[0].alamat || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Info Tambahan Penjamin */}
                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <UserCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-purple-900">Status Penjamin</p>
                          <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                            Terdaftar sebagai penjamin untuk klien{' '}
                            <span className="font-semibold">{detailData?.nama_klien}</span>.
                            Data penjamin digunakan sebagai kontak darurat dan referensi dalam proses layanan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="font-medium text-slate-500">Data Penjamin Belum Tersedia</p>
                  <p className="text-xs mt-1 italic">Penjamin untuk klien ini belum didaftarkan ke dalam sistem.</p>
                </div>
              )}
            </TabsContent>

            {/* ─────────── SUB-TAB: LOG AKTIVITAS ─────────── */}
            <TabsContent value="log">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-6 flex gap-3 items-start">
                  <History className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Log Aktivitas Data</p>
                    <p className="text-xs text-amber-700 mt-1">Menampilkan perubahan yang dilakukan oleh sistem.</p>
                  </div>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8 pb-4">
                  {/* Input Awal */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 bg-green-500 rounded-full w-5 h-5 border-4 border-white shadow-sm" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Input Awal</p>
                    <p className="text-sm font-semibold text-slate-800">Data Klien Didaftarkan</p>
                    <p className="text-xs text-slate-500 mt-1">Sistem mencatat registrasi awal klien pada database Monalisa.</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(detailData?.created_at)}</span>
                    </div>
                  </div>

                  {/* Penjamin (conditional) */}
                  {detailData?.penjamin && detailData.penjamin.length > 0 && (
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 bg-purple-500 rounded-full w-5 h-5 border-4 border-white shadow-sm" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Penjamin</p>
                      <p className="text-sm font-semibold text-slate-800">Data Penjamin Terdaftar</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {detailData.penjamin[0].nama_penjamin} ({detailData.penjamin[0].hubungan_klien || 'Hubungan tidak diketahui'})
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {detailData.penjamin[0].created_at
                            ? formatDateTime(detailData.penjamin[0].created_at)
                            : 'Waktu tidak tercatat'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Update Terakhir */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 bg-blue-500 rounded-full w-5 h-5 border-4 border-white shadow-sm" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pembaruan</p>
                    <p className="text-sm font-semibold text-slate-800">Update Data Terakhir</p>
                    <p className="text-xs text-slate-500 mt-1">Perubahan pada field profil atau sinkronisasi data.</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {detailData?.updated_at
                          ? formatDateTime(detailData.updated_at)
                          : 'Belum ada update data'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium">Mengambil data komprehensif...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}