import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Camera, CheckCircle2, Focus, XCircle, Phone, ChevronsUpDown, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PKWajibLaporDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleClients: any[];
  onSuccess: () => void;
  initialClientId?: string;
  initialPhone?: string;
}

export function PKWajibLaporDialog({ 
  isOpen, 
  onOpenChange, 
  eligibleClients, 
  onSuccess,
  initialClientId = "",
  initialPhone = ""
}: PKWajibLaporDialogProps) {
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState(initialClientId);
  const [telepon, setTelepon] = useState(initialPhone);
  const [keterangan, setKeterangan] = useState("");
  const [openCombo, setOpenCombo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera & Photo States
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sinkronisasi state saat dibuka dari tabel
  useEffect(() => {
    if (isOpen) {
      setSelectedClient(initialClientId);
      setTelepon(initialPhone);
    }
  }, [isOpen, initialClientId, initialPhone]);

  useEffect(() => {
    if (isCameraOpen) startStream();
    else stopStream();
    return () => stopStream();
  }, [isCameraOpen]);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
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

  const resetData = () => {
    setSelectedClient("");
    setTelepon("");
    setKeterangan("");
    setPhoto(null);
    setPhotoPreview(null);
    setIsCameraOpen(false);
  };

  const handleClose = () => {
    resetData();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return toast({ variant: "destructive", title: "Error", description: "Pilih klien terlebih dahulu." });
    if (!photo) return toast({ variant: "destructive", title: "Error", description: "Foto wajib dilampirkan." });

    setIsSubmitting(true);
    try {
      const { error: phoneError } = await supabase
        .from('klien')
        .update({ nomor_telepon: telepon })
        .eq('id_klien', parseInt(selectedClient));
      
      if (phoneError) throw phoneError;

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
        status_validasi: 'Valid' 
      });

      if (dbError) throw dbError;

      toast({ title: "Berhasil", description: "Wajib Lapor disimpan dan nomor telepon diperbarui." });
      handleClose();
      onSuccess();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
        <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-emerald-600" /> Form Input Wajib Lapor Klien
          </DialogTitle>
          <DialogDescription>
            Lakukan verifikasi kehadiran klien dan perbarui informasi kontak jika diperlukan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-5">Identitas & Kontak</h4>
              <div className="space-y-5">
                <div className="grid gap-2">
                  <Label className="text-slate-600 font-semibold">Pilih Klien Bimbingan <span className="text-red-500">*</span></Label>
                  <Popover open={openCombo} onOpenChange={setOpenCombo}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCombo} className="w-full justify-between bg-slate-50 text-left h-auto py-3 border-slate-200">
                        {selectedClient ? (
                          <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-bold text-slate-900 truncate w-full">
                              {eligibleClients.find(c => String(c.id_klien) === selectedClient)?.nama_klien}
                            </span>
                            <span className="text-xs text-slate-500 truncate w-full">
                              Reg: {eligibleClients.find(c => String(c.id_klien) === selectedClient)?.nomor_register_lapas}
                            </span>
                          </div>
                        ) : "Klik untuk memilih klien..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari nama, NIK, atau register..." />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan klien aktif atas nama Anda.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto">
                            {eligibleClients.map((c: any) => (
                              <CommandItem key={c.id_klien} value={`${c.nama_klien} ${c.nomor_register_lapas} ${c.nik_klien || ''}`} onSelect={() => { 
                                setSelectedClient(String(c.id_klien)); 
                                setTelepon(c.nomor_telepon || "");
                                setOpenCombo(false); 
                              }}>
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

                <div className={cn("grid gap-2 transition-opacity", !selectedClient && "opacity-50 pointer-events-none")}>
                  <Label className="text-slate-600 font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600"/> Nomor Telepon Klien Aktif
                  </Label>
                  <Input 
                    type="text" value={telepon} onChange={(e) => setTelepon(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="Contoh: 08123456789" className="bg-slate-50 border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 italic">*Nomor ini akan memperbarui database klien secara otomatis saat disimpan.</p>
                </div>

                <div className={cn("grid gap-2 transition-opacity", !selectedClient && "opacity-50 pointer-events-none")}>
                  <Label className="text-slate-600 font-semibold">Keterangan Aktivitas / Laporan</Label>
                  <Textarea 
                    value={keterangan} onChange={(e) => setKeterangan(e.target.value)} 
                    placeholder="Tuliskan aktivitas atau kondisi terkini klien..." rows={4} className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

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
                ) : photoPreview ? (
                  <div className="relative border-2 border-emerald-400 bg-emerald-50 rounded-xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                    <img src={photoPreview} alt="Preview Lapor" className="w-full max-h-[300px] object-cover rounded-md shadow-md mb-4 border border-white" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="gap-2 bg-white border-emerald-200 text-emerald-700">
                        <Camera className="w-4 h-4"/> Ambil Ulang
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="gap-2 text-red-500 hover:bg-red-50">
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
                      <Button type="button" onClick={() => setIsCameraOpen(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!selectedClient}>
                        <Focus className="w-4 h-4 mr-2" /> Buka Kamera
                      </Button>
                      <div className="relative flex-1">
                        <Button type="button" variant="outline" className="w-full border-slate-300" disabled={!selectedClient}>
                          <ImageIcon className="w-4 h-4 mr-2" /> Galeri
                        </Button>
                        <Input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={!selectedClient} />
                      </div>
                    </div>
                    {!selectedClient && <p className="text-[10px] text-red-500 font-medium">Silakan pilih klien terlebih dahulu.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Batalkan</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" disabled={isSubmitting || !photo || isCameraOpen || !selectedClient}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Menyimpan...</> : <><CheckCircle2 className="w-4 h-4 mr-2"/> Simpan Laporan</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}