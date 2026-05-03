import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Sparkles, Scale, Layout, GitMerge, PanelLeftClose, Moon 
} from 'lucide-react';

// Kunci unik untuk versi ini.
const VERSION_KEY = "monalisa_whats_new_v1.1"; 

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah pernah melihat pesan versi ini di browser ini
    const hasSeen = localStorage.getItem(VERSION_KEY);
    
    // Jika BELUM pernah melihat, baru tampilkan popup
    if (!hasSeen) {
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(VERSION_KEY, "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
             <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
             </div>
             <DialogTitle className="text-xl">Apa yang Baru?</DialogTitle>
          </div>
          <DialogDescription>
            Selamat datang kembali! Berikut adalah fitur terbaru sistem MONALISA Versi 1.1.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            
            {/* Fitur 1: Aturan 2026 */}
            <div className="flex gap-4">
               <div className="mt-1 bg-green-100 p-2 rounded-full h-fit">
                 <Scale className="w-5 h-5 text-green-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    Aturan Registrasi 2026
                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Mayor</Badge>
                 </h4>
                 <p className="text-sm text-slate-500 text-justify">
                    1. Sistem registrasi kini sepenuhnya mengikuti aturan terbaru tahun 2026. Alur data telah disesuaikan secara terstruktur melalui tahapan <strong>Pra-Adjudikasi, Adjudikasi, dan Post-Adjudikasi</strong>.
                 </p>
                 <p className="text-sm text-slate-500 text-justify">
                    2. Penambahan Session Login selama 60 meneit <strong>Untuk Keamanan</strong>.
                 </p>
               </div>
            </div>

            {/* Fitur 2: Desain Ulang */}
            <div className="flex gap-4">
               <div className="mt-1 bg-blue-100 p-2 rounded-full h-fit">
                 <Layout className="w-5 h-5 text-blue-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Desain Ulang Registrasi</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Tampilan antarmuka (UI) pada halaman registrasi telah dirombak total. Desain baru ini dirancang untuk memberikan pengalaman penginputan data yang lebih rapi, modern, dan intuitif.
                 </p>
               </div>
            </div>

            {/* Fitur 3: Penyesuaian Alur ke PK */}
            <div className="flex gap-4">
               <div className="mt-1 bg-indigo-100 p-2 rounded-full h-fit">
                 <GitMerge className="w-5 h-5 text-indigo-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Penyesuaian Alur ke PK</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Optimalisasi sinkronisasi data dari tahap awal registrasi hingga dokumen diteruskan ke Pembimbing Kemasyarakatan (PK). Alur dipastikan berjalan lebih presisi dan terintegrasi penuh ke halaman PK.
                 </p>
               </div>
            </div>

            {/* Fitur 4: Max/Min Side Menu */}
            <div className="flex gap-4">
               <div className="mt-1 bg-amber-100 p-2 rounded-full h-fit">
                 <PanelLeftClose className="w-5 h-5 text-amber-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Navigasi Dinamis (Max/Min Menu)</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Kini Anda dapat memperkecil (minimize) atau memperluas (maximize) <i>side menu</i> di sebelah kiri untuk memberikan ruang kerja layar yang lebih lega saat membaca atau menginput data.
                 </p>
               </div>
            </div>

            {/* Fitur 5: Dark/Light Mode */}
            <div className="flex gap-4">
               <div className="mt-1 bg-purple-100 p-2 rounded-full h-fit">
                 <Moon className="w-5 h-5 text-purple-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    Mode Gelap/Terang
                    <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700">Beta</Badge>
                 </h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Penambahan opsi tema visual <i>Dark Mode</i> dan <i>Light Mode</i>. Fitur ini masih dalam tahap pengembangan aktif untuk menyempurnakan kontras dan kenyamanan mata di seluruh halaman aplikasi.
                 </p>
               </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto mt-2 sm:mt-0">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Saya Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}