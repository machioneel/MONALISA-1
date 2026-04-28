import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

export default function WajibLapor() {
    const { toast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [keterangan, setKeterangan] = useState("");
    const [loading, setLoading] = useState(false);
    const [openCombo, setOpenCombo] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase.from('klien').select('id_klien, nama_klien, nomor_register_lapas');
            if (data) setClients(data);
        };
        fetchClients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return toast({ variant: "destructive", title: "Error", description: "Pilih klien terlebih dahulu." });
        if (!photo) return toast({ variant: "destructive", title: "Error", description: "Foto wajib dilampirkan." });

        setLoading(true);
        try {
            // Upload Photo to Supabase Storage (assuming bucket 'documents' is used)
            const fileExt = photo.name.split('.').pop();
            const fileName = `wajib_lapor/${Date.now()}_${selectedClient}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, photo);
            
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);

            // Insert to DB Table (Gunakan 'as any' untuk menghindari error TypeScript karena tabel baru)
            const { error: dbError } = await (supabase as any).from('wajib_lapor').insert({
                id_klien: parseInt(selectedClient),
                tanggal_lapor: new Date().toISOString(),
                foto_url: publicUrlData.publicUrl,
                keterangan: keterangan
            });

            if (dbError) throw dbError;

            toast({ title: "Berhasil", description: "Data Wajib Lapor berhasil disimpan." });
            setSelectedClient("");
            setPhoto(null);
            setKeterangan("");
            
            // Reset input file element
            const fileInput = document.getElementById('foto_lapor') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error: any) {
            toast({ variant: "destructive", title: "Gagal", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const selectedClientData = clients.find(c => String(c.id_klien) === selectedClient);

    return (
        <TestPageLayout title="Wajib Lapor" description="Laporan rutin klien." permissionCode="access_admin" icon={<Camera className="w-6 h-6" />}>
            <Card className="max-w-2xl mx-auto shadow-sm border-t-4 border-t-blue-600">
                <CardHeader>
                    <CardTitle>Form Wajib Lapor</CardTitle>
                    <CardDescription>Pilih klien dan unggah foto bukti wajib lapor (bisa menggunakan kamera HP).</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label>Pilih Klien <span className="text-red-500">*</span></Label>
                            <Popover open={openCombo} onOpenChange={setOpenCombo}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={openCombo} className="w-full justify-between bg-white">
                                        {selectedClient ? `${selectedClientData?.nama_klien} (${selectedClientData?.nomor_register_lapas})` : "Cari Klien..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari nama atau register..." />
                                        <CommandList>
                                            <CommandEmpty>Klien tidak ditemukan.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto">
                                                {clients.map((c) => (
                                                    <CommandItem key={c.id_klien} value={`${c.nama_klien} ${c.nomor_register_lapas}`} onSelect={() => { setSelectedClient(String(c.id_klien)); setOpenCombo(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedClient === String(c.id_klien) ? "opacity-100" : "opacity-0")} />
                                                        {c.nama_klien} - {c.nomor_register_lapas}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label>Ambil / Unggah Foto <span className="text-red-500">*</span></Label>
                            <Input id="foto_lapor" type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} required />
                            <p className="text-xs text-slate-500">Anda dapat mengambil foto langsung dari kamera HP.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Keterangan Tambahan</Label>
                            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Tuliskan keterangan kondisi klien saat ini..." />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                            Simpan Wajib Lapor
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TestPageLayout>
    );
}