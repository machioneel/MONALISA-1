import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Check, ChevronsUpDown, Image as ImageIcon, XCircle, Focus, MapPin, Navigation } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

export default function WajibLapor() {
    const { toast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [keterangan, setKeterangan] = useState("");
    const [loading, setLoading] = useState(false);
    const [openCombo, setOpenCombo] = useState(false);

    const [lokasi, setLokasi] = useState<{ lat: number; lng: number } | null>(null);
    const [loadingLokasi, setLoadingLokasi] = useState(false);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Koordinat default: Jakarta (ditampilkan saat lokasi belum dideteksi)
    const DEFAULT_LAT = -6.2088;
    const DEFAULT_LNG = 106.8456;
    const mapLat = lokasi ? lokasi.lat : DEFAULT_LAT;
    const mapLng = lokasi ? lokasi.lng : DEFAULT_LNG;

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await (supabase as any)
                .from('klien')
                .select(`
                    id_klien, 
                    nama_klien, 
                    nik_klien,
                    nomor_register_lapas,
                    peserta_bimbingan!inner(id_klien)
                `);

            if (data) {
                const uniqueClients = Array.from(new Map((data as any[]).map((item: any) => [item.id_klien, item])).values());
                setClients(uniqueClients);
            }
        };
        fetchClients();
    }, []);

    useEffect(() => {
        if (isCameraOpen) {
            startStream();
        } else {
            stopStream();
        }
        return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCameraOpen]);

    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Kamera Gagal", description: "Izin kamera ditolak atau perangkat tidak mendukung." });
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
                        const file = new File([blob], `wajib_lapor_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setPhoto(file);
                        setPhotoPreview(URL.createObjectURL(file));
                        setIsCameraOpen(false);
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const resetPhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
    };

    const dapatkanLokasi = () => {
        setLoadingLokasi(true);

        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Error", description: "Browser Anda tidak mendukung fitur lokasi." });
            setLoadingLokasi(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLokasi({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                toast({ title: "Berhasil", description: "Lokasi berhasil didapatkan." });
                setLoadingLokasi(false);
            },
            (error) => {
                let pesanError = "Gagal mendapatkan lokasi.";
                if (error.code === error.PERMISSION_DENIED) pesanError = "Izin lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.";
                toast({ variant: "destructive", title: "Gagal", description: pesanError });
                setLoadingLokasi(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return toast({ variant: "destructive", title: "Error", description: "Pilih klien terlebih dahulu." });
        if (!photo) return toast({ variant: "destructive", title: "Error", description: "Foto wajib dilampirkan." });
        if (!lokasi) return toast({ variant: "destructive", title: "Error", description: "Lokasi wajib diaktifkan." });

        setLoading(true);
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const { data: existingReport, error: checkError } = await (supabase as any)
                .from('wajib_lapor')
                .select('id')
                .eq('id_klien', parseInt(selectedClient))
                .gte('tanggal_lapor', startOfMonth)
                .lte('tanggal_lapor', endOfMonth)
                .limit(1); 

            if (checkError) throw checkError;

            if (existingReport && existingReport.length > 0) {
                toast({ 
                    variant: "destructive", 
                    title: "Ditolak: Sudah Lapor", 
                    description: "Anda sudah melakukan wajib lapor pada bulan ini. Laporan hanya diperbolehkan maksimal 1 kali per bulan." 
                });
                setLoading(false);
                return; 
            }

            const fileExt = photo.name.split('.').pop();
            const fileName = `wajib_lapor/${Date.now()}_${selectedClient}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, photo);
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);

            const { error: dbError } = await (supabase as any).from('wajib_lapor').insert({
                id_klien: parseInt(selectedClient),
                tanggal_lapor: new Date().toISOString(),
                foto_url: publicUrlData.publicUrl,
                keterangan: keterangan,
                status_validasi: 'Menunggu Validasi',
                latitude: lokasi.lat,
                longitude: lokasi.lng
            });

            if (dbError) throw dbError;

            toast({ title: "Berhasil", description: "Laporan Wajib Lapor terkirim. Menunggu validasi dari Petugas PK Anda." });
            setSelectedClient("");
            resetPhoto();
            setKeterangan("");
            setLokasi(null);
            
        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const selectedClientData = clients.find(c => String(c.id_klien) === selectedClient);

    return (
        <TestPageLayout title="Form Wajib Lapor Klien" description="Laporan rutin kehadiran klien." permissionCode="" icon={<Camera className="w-6 h-6" />}>
            <Card className="max-w-5xl mx-auto shadow-md border-0 overflow-hidden">
                <CardContent className="p-6 bg-slate-50/50">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── BAGIAN 1: PILIH KLIEN ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                                Identitas Klien
                            </Label>
                            <Popover open={openCombo} onOpenChange={setOpenCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombo}
                                        className="w-full justify-between bg-slate-50 hover:bg-slate-100 text-left h-auto py-3 px-4 border-slate-300 rounded-xl"
                                    >
                                        {selectedClient ? (
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <span className="text-blue-700 font-bold text-sm">
                                                        {selectedClientData?.nama_klien?.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-start overflow-hidden">
                                                    <span className="font-semibold text-slate-900 truncate">{selectedClientData?.nama_klien}</span>
                                                    <span className="text-xs text-slate-500">Reg: {selectedClientData?.nomor_register_lapas}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">Cari dan pilih klien terdaftar...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[460px] p-0 shadow-xl rounded-xl border-slate-200">
                                    <Command>
                                        <CommandInput placeholder="Cari nama, NIK, atau register..." className="text-sm" />
                                        <CommandList>
                                            <CommandEmpty>Klien tidak ditemukan atau belum terdaftar dalam program pembimbingan.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {clients.map((c) => (
                                                    <CommandItem
                                                        key={c.id_klien}
                                                        value={`${c.nama_klien} ${c.nomor_register_lapas} ${c.nik_klien || ''}`}
                                                        onSelect={() => { setSelectedClient(String(c.id_klien)); setOpenCombo(false); }}
                                                        className="py-2.5"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-blue-600", selectedClient === String(c.id_klien) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800">{c.nama_klien}</span>
                                                            <span className="text-xs text-muted-foreground">Reg: {c.nomor_register_lapas}{c.nik_klien ? ` · NIK: ${c.nik_klien}` : ''}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* ── BAGIAN 2: FOTO + LOKASI (2 KOLOM SEJAJAR) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

                            {/* ── KOLOM KIRI: FOTO KEHADIRAN ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                                    Foto Bukti Kehadiran <span className="text-red-500 normal-case tracking-normal font-normal">*wajib</span>
                                </Label>

                                {isCameraOpen ? (
                                    <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex-1">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {/* Viewfinder overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
                                            <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
                                            <div className="absolute bottom-16 left-3 w-7 h-7 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
                                            <div className="absolute bottom-16 right-3 w-7 h-7 border-b-2 border-r-2 border-white/80 rounded-br-md" />
                                        </div>
                                        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-5 z-10">
                                            <Button type="button" size="icon" variant="destructive" className="rounded-full shadow-lg h-10 w-10 opacity-80" onClick={() => setIsCameraOpen(false)}>
                                                <XCircle className="w-5 h-5" />
                                            </Button>
                                            <Button type="button" size="icon" className="rounded-full shadow-xl h-16 w-16 bg-white hover:bg-slate-100 text-blue-600 border-4 border-blue-300" onClick={capturePhoto}>
                                                <Focus className="w-8 h-8" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : photoPreview ? (
                                    <div className="flex flex-col items-center gap-3 flex-1">
                                        <div className="relative w-full rounded-xl overflow-hidden border-2 border-blue-300 shadow-md">
                                            <img src={photoPreview} alt="Preview Lapor" className="w-full object-cover max-h-[240px]" />
                                            <div className="absolute top-2 right-2">
                                                <Badge className="bg-green-600 text-white text-[10px] shadow">
                                                    <Check className="w-3 h-3 mr-1" /> Foto Siap
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="flex-1 gap-2 text-xs h-9 rounded-xl border-slate-300">
                                                <Camera className="w-3.5 h-3.5"/> Ambil Ulang
                                            </Button>
                                            <Button type="button" variant="destructive" onClick={resetPhoto} className="flex-1 gap-2 text-xs h-9 rounded-xl">
                                                <XCircle className="w-3.5 h-3.5"/> Hapus
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition-all rounded-xl p-6 flex flex-col items-center justify-center gap-4 flex-1">
                                        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-md shadow-blue-200">
                                            <Camera className="w-7 h-7" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-bold text-slate-700">Ambil atau Upload Foto</p>
                                            <p className="text-xs text-slate-400 leading-relaxed">Gunakan kamera perangkat untuk<br/>memverifikasi kehadiran secara langsung.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-[240px]">
                                            <Button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 text-xs rounded-xl shadow-sm">
                                                <Focus className="w-3.5 h-3.5 mr-1.5" /> Buka Kamera
                                            </Button>
                                            <div className="relative flex-1">
                                                <Button type="button" variant="outline" className="w-full h-9 text-xs rounded-xl border-slate-300">
                                                    <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Upload
                                                </Button>
                                                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── KOLOM KANAN: LOKASI + MINIMAP (selalu tampil) ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                
                                {/* Header lokasi */}
                                <div className="px-5 pt-5 pb-3 flex flex-col gap-3 shrink-0">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                                        Lokasi Perangkat <span className="text-red-500 normal-case tracking-normal font-normal">*wajib</span>
                                    </Label>

                                    <Button 
                                        type="button" 
                                        onClick={dapatkanLokasi}
                                        disabled={loadingLokasi}
                                        className={cn(
                                            "w-full h-10 rounded-xl text-sm font-semibold transition-all shadow-sm",
                                            lokasi
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        )}
                                    >
                                        {loadingLokasi 
                                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            : lokasi 
                                                ? <Check className="w-4 h-4 mr-2" />
                                                : <Navigation className="w-4 h-4 mr-2" />
                                        }
                                        {loadingLokasi ? "Mendeteksi Lokasi..." : lokasi ? "Lokasi Berhasil Direkam" : "Deteksi Lokasi Saat Ini"}
                                    </Button>

                                    {/* Koordinat pill — tampil jika ada lokasi */}
                                    {lokasi ? (
                                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                                            <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                            <span className="font-mono text-[11px] text-green-800 font-bold truncate">
                                                {lokasi.lat.toFixed(6)}, {lokasi.lng.toFixed(6)}
                                            </span>
                                            <Badge className="ml-auto bg-green-600 text-white text-[9px] px-1.5 py-0.5 shrink-0">Live</Badge>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <span className="text-[11px] text-amber-700 leading-tight">
                                                Peta menampilkan lokasi default. Klik tombol di atas untuk merekam posisi Anda.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Minimap — SELALU TAMPIL */}
                                <div className="flex-1 flex flex-col min-h-[200px] relative">
                                    {/* Overlay "belum dideteksi" di atas peta */}
                                    {!lokasi && (
                                        <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 pointer-events-none">
                                            <div className="bg-white/90 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
                                                <MapPin className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs font-semibold text-slate-600">Lokasi belum dideteksi</span>
                                            </div>
                                        </div>
                                    )}
                                    <iframe
                                        key={`${mapLat}-${mapLng}`}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight={0}
                                        marginWidth={0}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.005},${mapLat - 0.005},${mapLng + 0.005},${mapLat + 0.005}&layer=mapnik${lokasi ? `&marker=${mapLat},${mapLng}` : ''}`}
                                        className="w-full flex-1 min-h-[200px] bg-slate-100"
                                        title="Peta Lokasi"
                                    />
                                    <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-between shrink-0">
                                        <span className="text-[10px] text-slate-400">
                                            {lokasi ? "Posisi GPS terkunci" : "Peta default · Jakarta"}
                                        </span>
                                        <a 
                                            href={`https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}#map=16/${mapLat}/${mapLng}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-blue-600 hover:underline font-semibold"
                                        >
                                            Buka Peta Penuh ↗
                                        </a>
                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* ── AKHIR GRID 2 KOLOM ── */}

                        {/* ── BAGIAN 3: KETERANGAN ── */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">
                                Keterangan Tambahan
                            </Label>
                            <Textarea 
                                value={keterangan} 
                                onChange={(e) => setKeterangan(e.target.value)} 
                                placeholder="Tuliskan keterangan aktivitas atau kondisi klien saat ini (opsional)..." 
                                rows={3}
                                className="resize-none bg-slate-50 border-slate-200 rounded-xl text-sm focus-visible:ring-blue-400"
                            />
                        </div>

                        {/* ── TOMBOL SUBMIT ── */}
                        <Button 
                            type="submit" 
                            className={cn(
                                "w-full py-6 text-base font-bold rounded-2xl shadow-lg transition-all",
                                (!photo || !selectedClient || !lokasi || loading || isCameraOpen)
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white shadow-blue-200"
                            )}
                            disabled={loading || !photo || isCameraOpen || !selectedClient || !lokasi}
                        >
                            {loading 
                                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim Laporan...</>
                                : <><Check className="mr-2 h-5 w-5" /> Kirim Laporan Kehadiran</>
                            }
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </TestPageLayout>
    );
}