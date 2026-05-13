import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AnevSelectorProps {
  onSelect: (anevId: string) => void;
  selectedAnevId: string;
}

type AnevOption = {
  user_id: string;
  nama: string;
  jabatan: string;
};

// Definisi manual tipe data hasil query
type RawAnevRow = {
  user_id: string;
  users: {
    employees: {
      nama: string;
      jabatan: string;
    } | null;
  } | null;
};

export function AnevSelector({ onSelect, selectedAnevId }: AnevSelectorProps) {
  const [anevList, setAnevList] = useState<AnevOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [myJabatan, setMyJabatan] = useState<string>("");

  useEffect(() => {
    const fetchLogic = async () => {
      setLoading(true);
      try {
        // 1. Cek User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // --- FIX UTAMA DISINI ---
        // Jangan query 'employees' langsung karena tidak punya 'user_id'.
        // Query ke tabel 'users' (public.users) yang menghubungkan auth.users dengan employees.
        const { data: userData, error: userError } = await supabase
          .from("users") 
          .select(`
            employees (
              jabatan
            )
          `)
          .eq("id", user.id) // id di tabel public.users sama dengan auth.users.id
          .single();

        if (userError) {
           console.error("Error fetching user profile:", userError);
        }

        // Ambil jabatan dari hasil relasi
        const jabatanSayaRaw = (userData as any)?.employees?.jabatan || "";
        setMyJabatan(jabatanSayaRaw);

        // 2. Tentukan Keyword Jabatan (Dibuat lebih fleksibel tanpa kata "ahli")
        const myLevel = jabatanSayaRaw.toLowerCase();
        let allowedKeywords: string[] = [];

        if (myLevel.includes("pertama")) {
          // PK Pertama diverifikasi oleh Muda, Madya, atau Utama
          allowedKeywords = ["muda", "madya", "utama"];
        } else if (myLevel.includes("muda")) {
          // PK Muda diverifikasi oleh Madya atau Utama
          allowedKeywords = ["madya", "utama"];
        } else if (myLevel.includes("madya")) {
          // PK Madya diverifikasi oleh sesama Madya atau Utama
          allowedKeywords = ["madya", "utama"];
        } else {
          // Fallback (Jaga-jaga jika jabatan tidak terdeteksi dengan jelas)
          allowedKeywords = ["muda", "madya", "utama"];
        }

        // 3. Ambil User dengan Role Anev
        // @ts-ignore
        const { data: rawAnevs, error } = await supabase
          .from("user_roles")
          .select(`
            user_id,
            roles!inner(code),
            users!inner(
              employees!inner(nama, jabatan)
            )
          `)
          .eq("roles.code", "anev");

        if (error) throw error;

        // 4. Mapping Data
        const validAnevs = ((rawAnevs || []) as unknown as RawAnevRow[])
          .map((item) => ({
            user_id: item.user_id,
            nama: item.users?.employees?.nama || "Tanpa Nama",
            jabatan: item.users?.employees?.jabatan || "",
          }))
          .filter((anev) => {
            // --- FITUR BARU: MENCEGAH PK MENUNJUK DIRI SENDIRI ---
            if (anev.user_id === user.id) {
              return false; // Jangan masukkan diri sendiri ke dalam daftar
            }

            const anevJob = anev.jabatan.toLowerCase();
            return allowedKeywords.some((keyword) => anevJob.includes(keyword));
          });

        setAnevList(validAnevs);

      } catch (err) {
        console.error("Gagal memuat daftar Anev:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogic();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center text-xs text-muted-foreground py-2">
        <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Memuat daftar Anev...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Tunjuk Anev (Verifikator)</Label>
      
      <div className="text-xs text-muted-foreground mb-1 bg-slate-50 p-2 rounded border">
        Posisi Anda: <span className="font-semibold text-primary">{myJabatan || "Tidak diketahui"}</span>. 
        <br/>
        Sistem menampilkan Anev yang sesuai jenjang jabatan Anda.
      </div>
      
      <Select value={selectedAnevId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="-- Pilih Anev untuk verifikasi --" />
        </SelectTrigger>
        <SelectContent>
          {anevList.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Tidak ditemukan Anev dengan jabatan yang sesuai kriteria.
            </div>
          ) : (
            anevList.map((anev) => (
              <SelectItem key={anev.user_id} value={anev.user_id}>
                <span className="font-medium">{anev.nama}</span> 
                <span className="text-xs text-muted-foreground ml-2">({anev.jabatan})</span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}