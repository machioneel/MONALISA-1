// @ts-nocheck
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FileReuploadProps {
  tableName: string; // misal: 'litmas', 'pembimbingan'
  primaryKeyColumn: string; // misal: 'id_litmas'
  recordId: number | string;
  targetColumn: string; // misal: 'hasil_litmas_url'
  currentUrl?: string | null;
  bucketName?: string;
  onSuccess?: () => void;
}

export function FileReupload({
  tableName,
  primaryKeyColumn,
  recordId,
  targetColumn,
  currentUrl,
  bucketName = "litmas",
  onSuccess
}: FileReuploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${tableName}_${recordId}_${targetColumn}_${Date.now()}.${fileExt}`;
      const filePath = `reuploads/${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Dapatkan Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // 3. Update Record di Database
      const { error: dbError } = await supabase
        .from(tableName)
        .update({ [targetColumn]: publicUrl })
        .eq(primaryKeyColumn, recordId);

      if (dbError) throw dbError;

      alert("File berhasil diunggah ulang!");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat mengunggah file: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {currentUrl && (
        <a 
          href={currentUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-blue-600 hover:underline"
        >
          Lihat File Saat Ini
        </a>
      )}
      <div className="flex items-center gap-3">
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="max-w-[300px]"
        />
        {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}