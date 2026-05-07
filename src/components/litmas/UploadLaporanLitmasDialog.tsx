import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface UploadLaporanProps {
  litmasId: number;
  klienName: string;
  onSuccess?: () => void;
}

export function UploadLaporanLitmasDialog({ litmasId, klienName, onSuccess }: UploadLaporanProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>("");
  const { toast } = useToast();

  // Fungsi untuk menangani pemilihan file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Fungsi untuk mengunggah file dan menyimpan data ke database
  const handleUpload = async () => {
    if (!file || !tanggalPelaksanaan) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap masukkan dokumen laporan dan tanggal pelaksanaan.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload file laporan ke Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `laporan_akhir_${litmasId}_${Date.now()}.${fileExt}`;
      const filePath = `hasil_litmas/${fileName}`;

      // PERBAIKAN: Mengubah bucket dari 'hasil_litmas' menjadi 'documents'
      const { error: uploadError } = await supabase.storage
        .from("documents") 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL Publik untuk file yang baru diunggah
      // PERBAIKAN: Mengubah bucket dari 'hasil_litmas' menjadi 'documents'
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // 3. Update data ke tabel litmas (TIDAK MENGUBAH STATUS DB)
      // Kita hanya mengisi URL laporan, waktu upload, dan waktu selesai kustom
      const { error: updateError } = await supabase
        .from("litmas")
        .update({
          hasil_litmas_url: publicUrlData.publicUrl,
          waktu_upload_laporan: new Date().toISOString(), // Waktu sistem saat ini
          waktu_selesai: new Date(tanggalPelaksanaan).toISOString(), // Tanggal kustom dari user
        }as any)
        .eq("id_litmas", litmasId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "Laporan Litmas berhasil diunggah. Alur dinyatakan selesai.",
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast({
        title: "Gagal Mengunggah",
        description: error.message || "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
            size="sm" 
            className="bg-green-600 w-full hover:bg-blue-700 text-xs h-9 shadow-sm font-medium"            
            >
            <FileText className="w-3 h-3 mr-2"/> Upload Laporan Litmas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Penyelesaian Litmas</DialogTitle>
          <DialogDescription>
            Unggah laporan akhir Litmas untuk klien <b>{klienName}</b> pasca sidang TPP.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tanggal_pelaksanaan">Tanggal Pelaksanaan (Kustom)</Label>
            <Input
              id="tanggal_pelaksanaan"
              type="date"
              value={tanggalPelaksanaan}
              onChange={(e) => setTanggalPelaksanaan(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file_laporan">Dokumen Laporan (PDF/DOCX)</Label>
            <Input
              id="file_laporan"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading ? "Mengunggah..." : "Simpan & Selesaikan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}