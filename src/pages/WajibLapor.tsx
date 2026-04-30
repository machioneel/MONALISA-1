import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Check, ChevronsUpDown, Image as ImageIcon, XCircle, Focus } from 'lucide-react';
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

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const fetchClients = async () => {
            // FIX: Menggunakan (supabase as any) agar TypeScript tidak protes
            // meskipun file types.ts belum di-generate ulang
            const { data } = await (supabase as any)
                .from('klien')
                .select(`
                    id_klien, 
                    nama_klien, 
                    nik_klien,
                    nomor_register_lapas,
                    litmas!inner(status)
                `)
                .in('litmas.status', ['Approved', 'Selesai']);

            if (data) {
                // FIX: Menambahkan cast tipe (item: any)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return toast({ variant: "destructive", title: "Error", description: "Pilih klien terlebih dahulu." });
        if (!photo) return toast({ variant: "destructive", title: "Error", description: "Foto wajib dilampirkan." });

        setLoading(true);
        try {
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
                status_validasi: 'Menunggu Validasi'
            });

            if (dbError) throw dbError;

            toast({ title: "Berhasil", description: "Laporan Wajib Lapor terkirim. Menunggu validasi dari Petugas PK Anda." });
            setSelectedClient("");
            resetPhoto();
            setKeterangan("");
            
        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const selectedClientData = clients.find(c => String(c.id_klien) === selectedClient);

    return (
        <TestPageLayout title="Wajib Lapor" description="Laporan rutin kehadiran klien." permissionCode="access_admin" icon={<Camera className="w-6 h-6" />}>
            <Card className="max-w-2xl mx-auto shadow-sm border-t-4 border-t-blue-600">
                <CardHeader>
                    <CardTitle>Form Wajib Lapor Klien</CardTitle>
                    <CardDescription>Pilih nama Anda, lalu ambil foto bukti kehadiran secara langsung.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label>Pilih Klien Terdaftar <span className="text-red-500">*</span></Label>
                            <Popover open={openCombo} onOpenChange={setOpenCombo}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={openCombo} className="w-full justify-between bg-white text-left h-auto py-3">
                                        {selectedClient ? (
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <span className="font-semibold text-slate-900 truncate w-full">{selectedClientData?.nama_klien}</span>
                                                <span className="text-xs text-slate-500 truncate w-full">Reg: {selectedClientData?.nomor_register_lapas}</span>
                                            </div>
                                        ) : "Cari Klien..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari nama, NIK, atau register..." />
                                        <CommandList>
                                            <CommandEmpty>Klien tidak ditemukan / belum TPP.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {/* Pencarian dengan NIK */}
                                                {clients.map((c) => (
                                                    <CommandItem key={c.id_klien} value={`${c.nama_klien} ${c.nomor_register_lapas} ${c.nik_klien || ''}`} onSelect={() => { setSelectedClient(String(c.id_klien)); setOpenCombo(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedClient === String(c.id_klien) ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{c.nama_klien}</span>
                                                            <span className="text-xs text-muted-foreground">Reg: {c.nomor_register_lapas} {c.nik_klien ? `• NIK: ${c.nik_klien}` : ''}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label>Foto Bukti Kehadiran <span className="text-red-500">*</span></Label>
                            
                            {isCameraOpen ? (
                                <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex flex-col items-center justify-center border-2 border-blue-500">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    <canvas ref={canvasRef} className="hidden" />
                                    
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10 px-4">
                                        <Button type="button" size="icon" variant="destructive" className="rounded-full shadow-lg h-12 w-12" onClick={() => setIsCameraOpen(false)}>
                                            <XCircle className="w-6 h-6" />
                                        </Button>
                                        <Button type="button" size="icon" className="rounded-full shadow-lg h-16 w-16 bg-white hover:bg-slate-200 text-blue-600 border-4 border-blue-200" onClick={capturePhoto}>
                                            <Focus className="w-8 h-8" />
                                        </Button>
                                    </div>
                                </div>
                            ) : photoPreview ? (
                                <div className="relative border-2 border-blue-400 bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center">
                                    <img src={photoPreview} alt="Preview Lapor" className="w-full max-w-[280px] h-auto object-cover rounded-md shadow-md mb-4 border" />
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="gap-2 bg-white">
                                            <Camera className="w-4 h-4"/> Ambil Ulang
                                        </Button>
                                        <Button type="button" variant="destructive" onClick={resetPhoto} className="gap-2">
                                            <XCircle className="w-4 h-4"/> Hapus
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-bold text-slate-700">Ambil Foto Langsung</p>
                                        <p className="text-xs text-slate-500">Gunakan kamera perangkat untuk memverifikasi kehadiran.</p>
                                    </div>
                                    
                                    <div className="flex gap-3 mt-2 w-full max-w-xs">
                                        <Button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                            <Focus className="w-4 h-4 mr-2" /> Buka Kamera
                                        </Button>
                                        <div className="relative flex-1">
                                            <Button type="button" variant="outline" className="w-full">
                                                <ImageIcon className="w-4 h-4 mr-2" /> Upload File
                                            </Button>
                                            <Input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Keterangan Tambahan</Label>
                            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Tuliskan keterangan aktivitas/kondisi klien saat ini..." rows={3} />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !photo || isCameraOpen}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Kirim Laporan Kehadiran
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TestPageLayout>
    );
}