import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TestPageLayout } from '@/components/TestPageLayout'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardList, Gavel, Loader2, Check, ChevronsUpDown, Search, 
  UserCheck, History, XCircle, FileText, Plus, Trash2,
  CloudUpload, Clock, ExternalLink, AlertOctagon, User, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { subDays } from 'date-fns';

// --- IMPORTS DARI FILE LAIN ---
import { DurationInput } from '@/components/registrasi/Features/DurationInput';
import { SuggestionList } from '@/components/registrasi/Features/SuggestionList';
import { ClientSelector } from '@/components/registrasi/Features/ClientSelector';
import { PetugasPK, Klien } from '@/types/auth'; 
import { Database } from '@/integrations/supabase/types';

// --- IMPORTS KOMPONEN LAYANAN ---
import { FormLitmas } from '@/components/registrasi/FormLayanan/FormLitmas';
import { FormPendampingan } from '@/components/registrasi/FormLayanan/FormPendampingan';
import { FormPengawasan } from '@/components/registrasi/FormLayanan/FormPengawasan';
import { FormPembimbingan } from '@/components/registrasi/FormLayanan/FormPembimbingan';

// --- IMPORTS KOMPONEN YANG TELAH DIPISAH ---
import { FormKlien } from '@/components/registrasi/FormKlien';
import { FormPenjamin } from '@/components/registrasi/FormPenjamin';
import { DataTerdaftar } from '@/components/registrasi/DataTerdaftar';

// --- KONSTANTA HIERARKI ---
import { HIERARKI_LAYANAN_ANAK, HIERARKI_LAYANAN_DEWASA } from '@/constants/registrasi'; 

// --- TYPE DEFINITIONS ---
type RefAgama = Database['public']['Tables']['ref_agama']['Row'];
type RefPendidikan = Database['public']['Tables']['ref_pendidikan']['Row'];
type RefPekerjaan = Database['public']['Tables']['ref_pekerjaan']['Row'];
type RefHubungan = Database['public']['Tables']['ref_hubungan']['Row'];
type RefUpt = Database['public']['Tables']['ref_upt']['Row'];
type RefJenisLitmas = Database['public']['Tables']['ref_jenis_litmas']['Row'];
type RefBapas = Database['public']['Tables']['ref_bapas']['Row'];
type RefPerkara = Database['public']['Tables']['ref_perkara']['Row'];

const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (e) {
    return isoString;
  }
};

const LAYANAN_TABLE_MAP: Record<string, string> = {
  litmas: 'litmas',
  pendampingan: 'pendampingan',
  pengawasan: 'pengawasan',
  pembimbingan: 'pembimbingan',
};

const PK_COLUMN_MAP: Record<string, string> = {
  litmas: 'id_litmas',
  pendampingan: 'id_pendampingan',
  pengawasan: 'id_pengawasan',
  pembimbingan: 'id_pembimbingan',
};

interface RefKelurahanExtended { 
  id_kelurahan: number; 
  nama_kelurahan: string; 
  kecamatan_id: number | null;
  ref_kecamatan: { nama_kecamatan: string; } | null;
}

// --- SEARCHABLE COMBOBOX COMPONENT ---
export const SearchableSelect = ({ 
  options, value, onSelect, labelKey, valueKey, placeholder, searchPlaceholder, name, allowClear = true
}: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((item: any) => String(item[valueKey]) === value)?.[labelKey];

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal bg-white">
            {value && selectedLabel ? selectedLabel : <span className="text-muted-foreground">{placeholder}</span>}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {allowClear && value && (
                  <CommandItem onSelect={() => { onSelect(""); setOpen(false); }} className="text-red-500 font-medium cursor-pointer bg-red-50 mb-1">
                    <XCircle className="mr-2 h-4 w-4" /> Kosongkan Pilihan
                  </CommandItem>
                )}
                {options.map((item: any) => (
                  <CommandItem key={item[valueKey]} value={item[labelKey]} onSelect={() => { onSelect(String(item[valueKey])); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === String(item[valueKey]) ? "opacity-100" : "opacity-0")} />
                    {item[labelKey]}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
};

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  const isOpAnak = hasRole('op_reg_anak');
  const isOpDewasa = hasRole('op_reg_dewasa');
  const userRoleCategory = isOpAnak ? "Anak" : (isOpDewasa ? "Dewasa" : "Admin");

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState("klien");
  const [loading, setLoading] = useState(false);
  const [layananSubTab, setLayananSubTab] = useState("litmas"); 
  const [tahapanLayanan, setTahapanLayanan] = useState<"Pra Adjudikasi" | "Adjudikasi" | "Pasca Adjudikasi" | "">("");
  
  // --- STATE DATA REFERENSI ---
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [refAgama, setRefAgama] = useState<RefAgama[]>([]);
  const [refPendidikan, setRefPendidikan] = useState<RefPendidikan[]>([]);
  const [refPekerjaan, setRefPekerjaan] = useState<RefPekerjaan[]>([]);
  const [refHubungan, setRefHubungan] = useState<RefHubungan[]>([]);
  const [refUpt, setRefUpt] = useState<RefUpt[]>([]);
  const [refJenisLitmas, setRefJenisLitmas] = useState<RefJenisLitmas[]>([]);
  const [refBapas, setRefBapas] = useState<RefBapas[]>([]);
  const [refKelurahan, setRefKelurahan] = useState<RefKelurahanExtended[]>([]);
  const [refPerkara, setRefPerkara] = useState<RefPerkara[]>([]);

  // State Data Operasional
  const [listKlien, setListKlien] = useState<Klien[]>([]);
  const [dataLitmas, setDataLitmas] = useState<any[]>([]);
  const [dataKlienFull, setDataKlienFull] = useState<any[]>([]);

  // Selection & Forms
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [originalPkId, setOriginalPkId] = useState<string | null>(null);
  const [openPkCombo, setOpenPkCombo] = useState(false);

  // Klien States
  const [namaAlias, setNamaAlias] = useState<string[]>(['']);
  const [kewarganegaraan, setKewarganegaraan] = useState("WNI");
  const [residivis, setResidivis] = useState("Tidak");
  const [statusPerkawinan, setStatusPerkawinan] = useState("");
  const [selectedAgama, setSelectedAgama] = useState<string>("");
  const [selectedPendidikan, setSelectedPendidikan] = useState<string>("");
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<string>("");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("");
  const [manualKecamatan, setManualKecamatan] = useState<string>("");
  
  // Penjamin States
  const [selectedHubungan, setSelectedHubungan] = useState<string>("");
  const [selectedAgamaPenjamin, setSelectedAgamaPenjamin] = useState<string>("");
  const [selectedPendidikanPenjamin, setSelectedPendidikanPenjamin] = useState<string>("");
  const [selectedPekerjaanPenjamin, setSelectedPekerjaanPenjamin] = useState<string>("");
  const [selectedKelurahanPenjamin, setSelectedKelurahanPenjamin] = useState<string>(""); 
  const [manualKecamatanPenjamin, setManualKecamatanPenjamin] = useState<string>("");
  const [penjaminTglLahir, setPenjaminTglLahir] = useState("");
  const [penjaminUsia, setPenjaminUsia] = useState("");

  // Layanan States
  const [selectedJenisLitmas, setSelectedJenisLitmas] = useState<string>("");
  const [selectedUpt, setSelectedUpt] = useState<string>("");
  const [selectedBapas, setSelectedBapas] = useState<string>(""); 
  const [nomorUrutLayanan, setNomorUrutLayanan] = useState("");

  // Edit Mode States
  const [editingKlien, setEditingKlien] = useState<any | null>(null);
  const [editingPenjamin, setEditingPenjamin] = useState<any | null>(null);
  const [editingLitmas, setEditingLitmas] = useState<any | null>(null);
  const [editingLayananId, setEditingLayananId] = useState<number | null>(null);
  const [editingLayananTable, setEditingLayananTable] = useState<string>('litmas');
  
  // Validasi & Hitungan States
  const [tglLahir, setTglLahir] = useState("");
  const [hitungUsia, setHitungUsia] = useState("");
  const [hitungKategori, setHitungKategori] = useState("");
  const [usiaWarning, setUsiaWarning] = useState<string | null>(null);
  const [isCategoryMismatch, setIsCategoryMismatch] = useState(false);
  const [klienDitakPernahDitolak, setKlienDitakPernahDitolak] = useState<any[]>([]); 
  
  // UI States
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [openLitmasDetail, setOpenLitmasDetail] = useState(false);
  const [selectedLitmasDetail, setSelectedLitmasDetail] = useState<any>(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [openRiwayatKlien, setOpenRiwayatKlien] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchKlienQuery, setSearchKlienQuery] = useState("");
  const [searchLitmasQuery, setSearchLitmasQuery] = useState("");
  const [matchesKlien, setMatchesKlien] = useState<any[]>([]);
  const [matchesPenjamin, setMatchesPenjamin] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Perkara & File Upload States
  const [perkaraList, setPerkaraList] = useState<any[]>([]);
  const [tempPerkara, setTempPerkara] = useState({
    pasal: '', tindak_pidana: '', juncto: '', nomor_putusan: '', 
    vonis_pidana: '', denda: '', subsider_pidana: '',
    uang_pengganti: '', restitusi: '',
    tanggal_mulai_ditahan: '', tanggal_ekspirasi: ''
  });
  const [fileSuratPermintaan, setFileSuratPermintaan] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'klien' | 'penjamin' | 'layanan' | null;
    payload: any | null;
    warningMessage?: string | null;
  }>({ isOpen: false, type: null, payload: null, warningMessage: null });

  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicatePayload, setDuplicatePayload] = useState<any>(null); 

  // --- LOGIC FUNCTIONS ---
  useEffect(() => {
    if (!editingLayananId) {
      setSelectedJenisLitmas("");
    }
  }, [layananSubTab, tahapanLayanan, editingLayananId]);

  const kategoriLayananAktif = hitungKategori ? hitungKategori : (userRoleCategory === 'Anak' ? 'Anak' : 'Dewasa');
  const activeHierarki = kategoriLayananAktif === 'Anak' ? HIERARKI_LAYANAN_ANAK : HIERARKI_LAYANAN_DEWASA;

  const currentJenisOptions = (tahapanLayanan && layananSubTab) 
    // @ts-ignore
    ? (activeHierarki[layananSubTab]?.[tahapanLayanan] || []).map((j: string) => ({ jenis: j }))
    : [];

  const handlePhoneValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, ''); 
    if (val.length > 14) val = val.slice(0, 14);     
    e.target.value = val;
  };

  const handleAddAlias = () => setNamaAlias([...namaAlias, '']);
  const handleRemoveAlias = (index: number) => {
    const list = [...namaAlias];
    list.splice(index, 1);
    setNamaAlias(list);
  };
  const handleAliasChange = (text: string, index: number) => {
    const list = [...namaAlias];
    list[index] = text;
    setNamaAlias(list);
  };

  const handleSelectKelurahan = (namaKelurahan: string) => {
    setSelectedKelurahan(namaKelurahan);
    const selected = refKelurahan.find(k => k.nama_kelurahan === namaKelurahan);
    if (selected) setManualKecamatan(selected.ref_kecamatan?.nama_kecamatan || "");
    else setManualKecamatan(""); 
  };

  const handleSelectKelurahanPenjamin = (namaKelurahan: string) => {
    setSelectedKelurahanPenjamin(namaKelurahan);
    const selected = refKelurahan.find(k => k.nama_kelurahan === namaKelurahan);
    if (selected) setManualKecamatanPenjamin(selected.ref_kecamatan?.nama_kecamatan || "");
    else setManualKecamatanPenjamin(""); 
  };

  const checkLiveDuplicate = useCallback(async (table: 'klien' | 'penjamin', field: string, value: string) => {
    if (!value || value.length < 3) {
      if (table === 'klien') setMatchesKlien([]); else setMatchesPenjamin([]);
      return;
    }
    const { data } = await supabase.from(table).select('*').ilike(field, `%${value}%`).limit(5);
    if (table === 'klien') setMatchesKlien(data || []); else setMatchesPenjamin(data || []);
  }, []);

  const calculateAgeAndCategory = useCallback((dateString: string) => {
    if (!dateString) return;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    setHitungUsia(age.toString());
    const kategoriByAge = age < 18 ? "Anak" : "Dewasa";
    setHitungKategori(kategoriByAge);
    let mismatch = false;
    if (isOpAnak && age >= 18) {
      setUsiaWarning("BLOCK: Usia >= 18 Tahun. Anda login sebagai Operator Anak.");
      mismatch = true;
    } else if (isOpDewasa && age < 18) {
      setUsiaWarning("BLOCK: Usia < 18 Tahun. Anda login sebagai Operator Dewasa.");
      mismatch = true;
    } else {
      setUsiaWarning(null);
      mismatch = false;
    }
    setIsCategoryMismatch(mismatch);
  }, [isOpAnak, isOpDewasa]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setTglLahir(dateVal);
    calculateAgeAndCategory(dateVal);
  };

  const handlePenjaminDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setPenjaminTglLahir(dateVal);
    if (!dateVal) {
      setPenjaminUsia("");
      return;
    }
    const birthDate = new Date(dateVal);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    setPenjaminUsia(age.toString());
  };

  const fetchReferences = useCallback(async () => {
    const { data: pkData } = await supabase.from('petugas_pk').select('*');
    if (pkData) setListPK(pkData as unknown as PetugasPK[]);
    const { data: agama } = await supabase.from('ref_agama').select('*');
    if (agama) setRefAgama(agama);
    const { data: pend } = await supabase.from('ref_pendidikan').select('*');
    if (pend) setRefPendidikan(pend);
    const { data: pek } = await supabase.from('ref_pekerjaan').select('*');
    if (pek) setRefPekerjaan(pek);
    const { data: hub } = await supabase.from('ref_hubungan').select('*');
    if (hub) setRefHubungan(hub);
    const { data: upt } = await supabase.from('ref_upt').select('*');
    if (upt) setRefUpt(upt);
    const { data: jl } = await supabase.from('ref_jenis_litmas').select('*');
    if (jl) setRefJenisLitmas(jl);
    const { data: bapas } = await supabase.from('ref_bapas').select('*');
    if (bapas) setRefBapas(bapas);
    const { data: kel } = await supabase.from('ref_kelurahan')
      .select(`id_kelurahan, nama_kelurahan, kecamatan_id, ref_kecamatan ( nama_kecamatan )`)
      .limit(2000); 
    if (kel) setRefKelurahan(kel as unknown as RefKelurahanExtended[]);
    const { data: rpData } = await supabase.from('ref_perkara').select('*').limit(500);
    if (rpData) setRefPerkara(rpData as RefPerkara[]);

    let queryKlien = supabase
      .from('klien')
      .select('id_klien, nama_klien, nomor_register_lapas')
      .order('id_klien', { ascending: false });
    if (isOpAnak) queryKlien = queryKlien.eq('kategori_usia', 'Anak');
    else if (isOpDewasa) queryKlien = queryKlien.eq('kategori_usia', 'Dewasa');
    const { data: k } = await queryKlien;
    if (k) setListKlien(k as unknown as Klien[]);
  }, [isOpAnak, isOpDewasa]);

  // ============================================================
  // FIX #2: fetchTableData — tiap tabel layanan di-fetch secara
  // individual dengan try/catch sendiri sehingga 403 Forbidden
  // pada satu tabel (mis. pembimbingan) tidak crash semua data.
  // ============================================================
  const fetchTableData = useCallback(async () => {
    setLoading(true);
    try {
      let qK = supabase
        .from('klien')
        .select('*, penjamin (*)')
        .order('id_klien', { ascending: false });

      if (isOpAnak) qK = qK.eq('kategori_usia', 'Anak');
      else if (isOpDewasa) qK = qK.eq('kategori_usia', 'Dewasa');
      
      const { data: kData, error: kErr } = await qK.limit(50);
      if (kErr) throw kErr;
      setDataKlienFull(kData || []);

      // Fetch tiap tabel layanan secara terpisah — error satu tidak crash yang lain
      const fetchLayanan = async (
        tableName: string,
        selectStr: string,
        orderCol: string,
        mapFn: (d: any) => any
      ): Promise<any[]> => {
        try {
          const { data, error } = await (supabase.from(tableName as any) as any)
            .select(selectStr)
            .order(orderCol, { ascending: false })
            .limit(20);
          if (error) {
            console.warn(`[fetchTableData] Tabel '${tableName}' gagal (${error.code}): ${error.message}`);
            return [];
          }
          return (data || []).map(mapFn);
        } catch (err: any) {
          console.warn(`[fetchTableData] Exception tabel '${tableName}':`, err.message);
          return [];
        }
      };

      const [litmasData, pendampinganData, pengawasanData, pembimbinganData] = await Promise.all([
        fetchLayanan(
          'litmas',
          `*, klien:klien!litmas_id_klien_fkey (*), petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip)`,
          'id_litmas',
          (d: any) => ({ ...d, _table: 'litmas', _id: d.id_litmas, kategori_layanan: d.kategori_layanan || 'litmas' })
        ),
        fetchLayanan(
          'pendampingan',
          `*, klien:klien!fk_pendampingan_klien (*), petugas_pk:petugas_pk!pendampingan_nama_pk_fkey (nama, nip)`,
          'id_pendampingan',
          (d: any) => ({ ...d, _table: 'pendampingan', _id: d.id_pendampingan, kategori_layanan: 'pendampingan' })
        ),
        fetchLayanan(
          'pengawasan',
          `*, klien:klien!fk_pengawasan_klien (*), petugas_pk:petugas_pk!pengawasan_nama_pk_fkey (nama, nip)`,
          'id_pengawasan',
          (d: any) => ({ ...d, _table: 'pengawasan', _id: d.id_pengawasan, kategori_layanan: 'pengawasan' })
        ),
        // FIX: Jika nama FK pembimbingan berbeda, coba tanpa FK hint dulu.
        // Sesuaikan nama FK hint jika sudah diketahui nama yang benar di Supabase.
        fetchLayanan(
          'pembimbingan',
          `*, klien:klien!fk_pembimbingan_klien (*), petugas_pk (nama, nip)`,
          'id_pembimbingan',
          (d: any) => ({ ...d, _table: 'pembimbingan', _id: d.id_pembimbingan, kategori_layanan: 'pembimbingan' })
        ),
      ]);

      const allLayanan = [
        ...litmasData,
        ...pendampinganData,
        ...pengawasanData,
        ...pembimbinganData,
      ].sort((a, b) =>
        new Date(b.waktu_registrasi || 0).getTime() - new Date(a.waktu_registrasi || 0).getTime()
      );

      setDataLitmas(allLayanan);
    } catch (e: any) { 
      console.error("Fetch Error:", e.message);
      toast({ variant: "destructive", title: "Gagal memuat tabel", description: e.message });
    } finally { 
      setLoading(false); 
    }
  }, [isOpAnak, isOpDewasa, toast]);

  const handleEditClick = async (item: any) => {
    setLoading(true); setMatchesKlien([]); setActiveInput(null);
    try {
      const { data, error } = await supabase
        .from('klien')
        .select(`
          *, 
          penjamin (*), 
          litmas:litmas!litmas_id_klien_fkey (
            *, 
            perkara (*), 
            petugas_pk:petugas_pk!litmas_nama_pk_fkey(nama)
          )
        `)
        .eq('id_klien', item.id_klien)
        .single();
      if (error) throw error;
      const safeData = data as any;
      setEditingKlien(safeData);
      
      setSelectedAgama(safeData.agama || "");
      setSelectedPendidikan(safeData.pendidikan || "");
      setSelectedPekerjaan(safeData.pekerjaan || "");
      setKewarganegaraan(safeData.kewarganegaraan || "WNI");
      setResidivis(safeData.residivis || "Tidak");
      setStatusPerkawinan(safeData.status_perkawinan || "");
      setNamaAlias(safeData.nama_alias || ['']);
      
      if (safeData.kelurahan) handleSelectKelurahan(safeData.kelurahan);
      else { setSelectedKelurahan(""); setManualKecamatan(""); }
      
      const pjn = safeData.penjamin?.[0] || null;
      setEditingPenjamin(pjn);
      if (pjn) {
        setSelectedHubungan(pjn.hubungan_klien || "");
        setSelectedAgamaPenjamin(pjn.agama || "");
        setSelectedPendidikanPenjamin(pjn.pendidikan || "");
        setSelectedPekerjaanPenjamin(pjn.pekerjaan || "");
        setPenjaminTglLahir(pjn.tanggal_lahir || "");
        if (pjn.tanggal_lahir) calculateAgeAndCategory(pjn.tanggal_lahir);
        if (pjn.kelurahan) handleSelectKelurahanPenjamin(pjn.kelurahan);
      }

      const firstLitmas = safeData.litmas?.[0] || null;
      setEditingLitmas(firstLitmas);
      setPerkaraList(firstLitmas?.perkara || []);
      if (firstLitmas) {
        setSelectedPkId(firstLitmas.nama_pk || null); 
        setOriginalPkId(firstLitmas.nama_pk || null);
        setSelectedJenisLitmas(firstLitmas.jenis_litmas || "");
        setSelectedUpt(firstLitmas.id_upt ? String(firstLitmas.id_upt) : "");
        setSelectedBapas(firstLitmas.asal_bapas || "");
        setTahapanLayanan((firstLitmas.tahapan_layanan as any) || "");
        setLayananSubTab(firstLitmas.kategori_layanan || "litmas");
        setNomorUrutLayanan(firstLitmas.nomor_urut ? String(firstLitmas.nomor_urut).padStart(4, '0') : "");
      }

      setSelectedClientId(safeData.id_klien);
      if (safeData.tanggal_lahir) {
        setTglLahir(safeData.tanggal_lahir);
        calculateAgeAndCategory(safeData.tanggal_lahir);
      }
      setActiveTab("klien");
      toast({ title: "Mode Edit Aktif", description: `Mengedit data: ${safeData.nama_klien}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal load data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setEditingKlien(null); setEditingPenjamin(null); setEditingLitmas(null);
    setEditingLayananId(null); setEditingLayananTable('litmas');
    setPerkaraList([]); setSelectedClientId(null); setSelectedPkId(null); setOriginalPkId(null);
    setMatchesKlien([]); setMatchesPenjamin([]); setActiveInput(null); setFileSuratPermintaan(null);
    setTglLahir(""); setHitungUsia(""); setHitungKategori("");
    setKlienDitakPernahDitolak([]);
    setTempPerkara({
      pasal: '', tindak_pidana: '', juncto: '', nomor_putusan: '',
      vonis_pidana: '', denda: '', subsider_pidana: '',
      uang_pengganti: '', restitusi: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: ''
    });
    setNamaAlias(['']); setKewarganegaraan("WNI"); setResidivis("Tidak"); setStatusPerkawinan("");
    setSelectedAgama(""); setSelectedPendidikan(""); setSelectedPekerjaan("");
    setSelectedKelurahan(""); setManualKecamatan("");
    setSelectedHubungan(""); setSelectedAgamaPenjamin(""); setSelectedPendidikanPenjamin(""); setSelectedPekerjaanPenjamin("");
    setSelectedKelurahanPenjamin(""); setManualKecamatanPenjamin("");
    setPenjaminTglLahir(""); setPenjaminUsia("");
    setSelectedJenisLitmas(""); setSelectedUpt(""); setSelectedBapas("");
    setTahapanLayanan(""); setLayananSubTab("litmas"); setNomorUrutLayanan("");
  };

  const handleCancelButton = (showToast = true) => {
    resetFormState();
    if (showToast) toast({ title: "Edit Dibatalkan", description: "Form direset." });
  };

  const handleEditLayananClick = async (layananItem: any) => {
    setLoading(true);
    try {
      const table = layananItem._table || 'litmas';
      const id = layananItem._id || layananItem.id_litmas;
      setEditingLayananTable(table);
      setEditingLayananId(id);

      const { data: klienData, error: kErr } = await supabase
        .from('klien')
        .select('*, penjamin (*)')
        .eq('id_klien', layananItem.id_klien)
        .single();
      if (kErr) throw kErr;
      const safeKlien = klienData as any;
      setEditingKlien(safeKlien);
      setSelectedClientId(safeKlien.id_klien);
      if (safeKlien.tanggal_lahir) {
        setTglLahir(safeKlien.tanggal_lahir);
        calculateAgeAndCategory(safeKlien.tanggal_lahir);
      }
      setSelectedAgama(safeKlien.agama || "");
      setSelectedPendidikan(safeKlien.pendidikan || "");
      setSelectedPekerjaan(safeKlien.pekerjaan || "");
      setKewarganegaraan(safeKlien.kewarganegaraan || "WNI");
      setResidivis(safeKlien.residivis || "Tidak");
      setStatusPerkawinan(safeKlien.status_perkawinan || "");
      setNamaAlias(safeKlien.nama_alias || ['']);
      if (safeKlien.kelurahan) handleSelectKelurahan(safeKlien.kelurahan);

      const pjn = safeKlien.penjamin?.[0] || null;
      setEditingPenjamin(pjn);
      if (pjn) {
        setSelectedHubungan(pjn.hubungan_klien || "");
        setSelectedAgamaPenjamin(pjn.agama || "");
        setSelectedPendidikanPenjamin(pjn.pendidikan || "");
        setSelectedPekerjaanPenjamin(pjn.pekerjaan || "");
        setPenjaminTglLahir(pjn.tanggal_lahir || "");
        if (pjn.kelurahan) handleSelectKelurahanPenjamin(pjn.kelurahan);
      }

      setEditingLitmas(layananItem);
      setSelectedPkId(layananItem.nama_pk || null);
      setOriginalPkId(layananItem.nama_pk || null);
      setLayananSubTab(table);
      
      setTimeout(() => {
        setTahapanLayanan(layananItem.tahapan_layanan || "");
        setTimeout(() => {
          setSelectedJenisLitmas(layananItem.jenis_litmas || "");
        }, 50);
      }, 50);
      
      setSelectedUpt(layananItem.id_upt ? String(layananItem.id_upt) : "");
      setSelectedBapas(layananItem.asal_bapas || "");
      setNomorUrutLayanan(layananItem.nomor_urut ? String(layananItem.nomor_urut).padStart(4, '0') : "");

      if (table === 'litmas') {
        const { data: perkaraData } = await supabase.from('perkara').select('*').eq('id_litmas', id);
        setPerkaraList(perkaraData || []);
      } else {
        setPerkaraList([]);
      }
      setActiveTab("layanan");
      toast({ title: "Mode Edit Layanan Aktif", description: `Mengedit layanan ${table.toUpperCase()} untuk: ${safeKlien.nama_klien}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal load layanan", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKlien = async () => {
    if (!searchKlienQuery) return fetchTableData();
    setLoading(true);
    const { data } = await supabase
      .from('klien')
      .select('*, penjamin (*), litmas (*, perkara (*), petugas_pk:petugas_pk!litmas_nama_pk_fkey(nama))')
      .ilike('nama_klien', `%${searchKlienQuery}%`)
      .limit(20);
    setDataKlienFull(data || []);
    setLoading(false);
  };

  const handleSearchLitmas = async () => {
    if (!searchLitmasQuery) return fetchTableData();
    setLoading(true);
    const { data } = await supabase
      .from('litmas')
      .select(`*, klien:klien!litmas_id_klien_fkey (*), petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip)`)
      .ilike('nomor_surat_permintaan', `%${searchLitmasQuery}%`)
      .limit(20);
    setDataLitmas(data || []);
    setLoading(false);
  };

  const uploadSuratPermintaan = async (file: File, namaKlien: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${namaKlien.replace(/\s+/g, '-')}_surat-permintaan.${fileExt}`;
      const { error } = await supabase.storage.from('surat-permintaan').upload(fileName, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('surat-permintaan').getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast({ variant: "destructive", title: "Gagal Upload", description: error.message });
      return null;
    }
  };

  // ============================================================
  // FIX #1: executeSave — perbaiki struktur try/catch yang nested.
  // Sebelumnya: try luar > if klien/penjamin/layanan, di dalam
  // layanan ada try bersarang tanpa menutup try luar dengan benar,
  // menyebabkan TS error 1472 dan komponen menjadi void.
  // Sesudah: setiap branch punya penanganan error sendiri yang jelas,
  // try luar tetap ada sebagai safety net.
  // ============================================================
  const executeSave = async () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setLoading(true);
    const { type, payload } = confirmDialog;
    const formData = payload as FormData;

    try {
      if (type === 'klien') {
        // --- Simpan Data Klien ---
        const kategoriFix = isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori);
        const dataKlien = {
          nik_klien: formData.get('nik_klien') as string,
          nama_klien: formData.get('nama_klien') as string,
          nomor_register_lapas: formData.get('nomor_register_klien') as string,
          jenis_kelamin: formData.get('jenis_kelamin') as string,
          agama: formData.get('agama') as string,
          pendidikan: formData.get('pendidikan') as string,
          tempat_lahir: formData.get('tempat_lahir') as string,
          tanggal_lahir: formData.get('tanggal_lahir') as string,
          usia: Number(formData.get('usia')),
          kategori_usia: kategoriFix,
          pekerjaan: formData.get('pekerjaan') as string,
          minat_bakat: formData.get('minat_bakat') as string,
          alamat: formData.get('alamat') as string,
          kelurahan: formData.get('kelurahan') as string,
          kecamatan: manualKecamatan,
          nomor_telepon: formData.get('nomor_telepon') as string,
          kewarganegaraan: kewarganegaraan,
          residivis: residivis,
          status_perkawinan: statusPerkawinan,
          nama_alias: namaAlias.filter(n => n.trim() !== ''),
        };

        if (editingKlien) {
          const { error } = await supabase.from('klien').update(dataKlien).eq('id_klien', editingKlien.id_klien);
          if (error) throw error;
        } else {
          const { data: newKlien, error } = await supabase.from('klien').insert(dataKlien).select('id_klien').single();
          if (error) throw error;
          setSelectedClientId(newKlien.id_klien);
          fetchReferences();
        }
        toast({ title: "Berhasil", description: "Data Klien disimpan." });
        setActiveTab("penjamin");

      } else if (type === 'penjamin') {
        // --- Simpan Data Penjamin ---
        const dataPenjamin = {
          id_klien: selectedClientId,
          nama_penjamin: formData.get('nama_penjamin') as string,
          nik_penjamin: formData.get('nik_penjamin') as string,
          hubungan_klien: formData.get('hubungan_klien') as string,
          agama: formData.get('agama') as string,
          tempat_lahir: formData.get('tempat_lahir') as string,
          tanggal_lahir: (formData.get('tanggal_lahir') as string) || null,
          usia: Number(formData.get('usia')),
          pendidikan: formData.get('pendidikan') as string,
          pekerjaan: formData.get('pekerjaan') as string,
          alamat: formData.get('alamat') as string,
          kelurahan: formData.get('kelurahan') as string,
          kecamatan: manualKecamatanPenjamin,
          nomor_telepon: formData.get('nomor_telepon') as string,
        };

        if (editingPenjamin) {
          await supabase.from('penjamin').update(dataPenjamin).eq('id_klien', selectedClientId);
        } else {
          await supabase.from('penjamin').insert(dataPenjamin);
        }
        toast({ title: "Berhasil", description: "Data Penjamin disimpan." });
        setActiveTab("layanan");

      } else if (type === 'layanan') {
        // --- Simpan Data Layanan ---
        let uploadedFileUrl: string | null = null;
        if (fileSuratPermintaan) {
          setIsUploading(true);
          const namaKlien = listKlien.find(k => k.id_klien === selectedClientId)?.nama_klien || "klien";
          uploadedFileUrl = await uploadSuratPermintaan(fileSuratPermintaan, namaKlien);
          setIsUploading(false);
          if (!uploadedFileUrl) {
            setLoading(false);
            return;
          }
        }

        const targetTable = LAYANAN_TABLE_MAP[layananSubTab] || 'litmas';

        const dataLayanan = {
          id_klien: selectedClientId,
          id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null,
          nama_pk: selectedPkId,
          nomor_urut: formData.get('nomor_urut') ? Number(formData.get('nomor_urut')) : null,
          nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
          tanggal_diterima_bapas: (formData.get('tanggal_diterima_bapas') as string) || null,
          jenis_litmas: selectedJenisLitmas,
          tanggal_registrasi: (formData.get('tanggal_registrasi') as string) || null,
          nomor_register_litmas: formData.get('nomor_register_litmas') as string,
          asal_bapas: formData.get('asal_bapas') as string,
          nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
          tanggal_surat_permintaan: (formData.get('tanggal_surat_permintaan') as string) || null,
          nomor_surat_pelimpahan: formData.get('nomor_surat_pelimpahan') as string,
          tanggal_surat_pelimpahan: (formData.get('tanggal_surat_pelimpahan') as string) || null,
          waktu_registrasi: new Date().toISOString(),
          waktu_tunjuk_pk: new Date().toISOString(),
          kategori_layanan: layananSubTab,
          tahapan_layanan: tahapanLayanan,
          ...(uploadedFileUrl
            ? { file_surat_permintaan_url: uploadedFileUrl }
            : editingLitmas?.file_surat_permintaan_url
            ? { file_surat_permintaan_url: editingLitmas.file_surat_permintaan_url }
            : {}),
        };

        // Kasus A: Kategori Layanan Berubah (pindah tabel)
        if (editingLayananId && editingLayananTable !== targetTable) {
          const { error: delErr } = await (supabase.from(editingLayananTable as any) as any)
            .delete()
            .eq(PK_COLUMN_MAP[editingLayananTable], editingLayananId);
          if (delErr) throw delErr;

          const { data: newData, error: insErr } = await (supabase.from(targetTable as any) as any)
            .insert(dataLayanan)
            .select(PK_COLUMN_MAP[targetTable])
            .single();
          if (insErr) throw insErr;

          if (targetTable === 'litmas' && perkaraList.length > 0) {
            const perkaraPayloads = perkaraList.map(p => ({
              id_litmas: newData[PK_COLUMN_MAP[targetTable]],
              pasal: p.pasal,
              tindak_pidana: p.tindak_pidana,
              juncto: p.juncto || null,
              nomor_putusan: p.nomor_putusan,
              vonis_pidana: p.vonis_pidana,
              denda: Number(p.denda) || 0,
              subsider_pidana: p.subsider_pidana,
              uang_pengganti: p.uang_pengganti || null,
              restitusi: p.restitusi || null,
              tanggal_mulai_ditahan: p.tanggal_mulai_ditahan || null,
              tanggal_ekspirasi: p.tanggal_ekspirasi || null,
            }));
            await supabase.from('perkara').insert(perkaraPayloads);
          }

        // Kasus B: Update Normal (tabel sama)
        } else if (editingLayananId) {
          const { error: updErr } = await (supabase.from(targetTable as any) as any)
            .update(dataLayanan)
            .eq(PK_COLUMN_MAP[targetTable], editingLayananId);
          if (updErr) throw updErr;

          if (targetTable === 'litmas') {
            await supabase.from('perkara').delete().eq('id_litmas', editingLayananId);
            if (perkaraList.length > 0) {
              const perkaraPayloads = perkaraList.map(({ id: _id, ...rest }) => ({
                ...rest,
                id_litmas: editingLayananId,
              }));
              await supabase.from('perkara').insert(perkaraPayloads);
            }
          }

        // Kasus C: Registrasi Baru
        } else {
          const { data: newData, error: insErr } = await (supabase.from(targetTable as any) as any)
            .insert(dataLayanan)
            .select(PK_COLUMN_MAP[targetTable])
            .single();
          if (insErr) throw insErr;

          if (targetTable === 'litmas' && perkaraList.length > 0) {
            const perkaraPayloads = perkaraList.map(({ id: _id, ...rest }) => ({
              ...rest,
              id_litmas: newData[PK_COLUMN_MAP[targetTable]],
            }));
            await supabase.from('perkara').insert(perkaraPayloads);
          }

          // FITUR BARU: Trigger Edge Function untuk Notifikasi Task Baru
          try {
            const namaKlienLengkap = listKlien.find(k => k.id_klien === selectedClientId)?.nama_klien || "Klien";
            await supabase.functions.invoke('send-new-task-notification', {
              body: {
                layanan_id: newData[PK_COLUMN_MAP[targetTable]],
                tabel_layanan: targetTable,
                id_pk: selectedPkId,
                nama_klien: namaKlienLengkap,
                jenis_layanan: selectedJenisLitmas
              }
            });
          } catch (notifErr) {
            console.error("Gagal mengirim notifikasi task baru:", notifErr);
            // Tidak me-lempar error agar registrasi tetap berhasil walau notif gagal
          }
        }

        toast({ title: "Selesai", description: "Data Layanan berhasil disimpan." });
        handleCancelButton(false);
        setActiveTab("list_data");
        fetchTableData();
      }
    } catch (e: any) {
      console.error("executeSave error:", e);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: e.message });
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const initiateSaveKlien = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCategoryMismatch) return toast({ variant: "destructive", title: "Blokir", description: "Usia tidak sesuai role." });
    const formData = new FormData(e.currentTarget);
    if (!editingKlien && matchesKlien.length > 0) {
      setDuplicatePayload(formData);
      setShowDuplicateAlert(true);
      return;
    }
    setConfirmDialog({ isOpen: true, type: 'klien', payload: formData, warningMessage: null });
  };

  const initiateSavePenjamin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
    const formData = new FormData(e.currentTarget);
    setConfirmDialog({ isOpen: true, type: 'penjamin', payload: formData, warningMessage: null });
  };

  const initiateSaveLayanan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
    if (!tahapanLayanan) return toast({ variant: "destructive", title: "Error", description: "Tahapan Layanan wajib dipilih." });
    if (!selectedJenisLitmas) return toast({ variant: "destructive", title: "Error", description: "Jenis Layanan wajib dipilih." });
    
    const formData = new FormData(e.currentTarget);
    const asalUpt = formData.get('id_upt') as string;
    const asalBapas = formData.get('asal_bapas') as string;
    const noPelimpahan = formData.get('nomor_surat_pelimpahan') as string;
    const noPermintaan = formData.get('nomor_surat_permintaan') as string;

    if (asalUpt && !noPermintaan) return toast({ variant: "destructive", title: "Gagal", description: "Nomor Surat Permintaan wajib diisi karena Asal UPT telah dipilih." });
    if (asalBapas && !noPelimpahan) return toast({ variant: "destructive", title: "Gagal", description: "Nomor Surat Pelimpahan wajib diisi karena Asal Bapas telah dipilih." });

    setConfirmDialog({ isOpen: true, type: 'layanan', payload: formData, warningMessage: null });
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    const historyArr: any[] = [];
    try {
      const { data: kData } = await supabase
        .from('klien')
        .select('id_klien, nama_klien, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });
      kData?.forEach((k: any) => historyArr.push({ type: 'Klien Baru', title: k.nama_klien, date: k.created_at, id: k.id_klien }));

      const { data: lData } = await supabase
        .from('litmas')
        .select('id_litmas, nomor_surat_permintaan, waktu_registrasi, klien (nama_klien)')
        .gte('waktu_registrasi', sevenDaysAgo)
        .order('waktu_registrasi', { ascending: false });
      lData?.forEach((l: any) => historyArr.push({
        type: 'Registrasi Layanan',
        title: `${l.nomor_surat_permintaan} (${l.klien?.nama_klien || 'N/A'})`,
        date: l.waktu_registrasi,
        id: l.id_litmas,
      }));

      historyArr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryData(historyArr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchReferences(); }, [fetchReferences]);
  useEffect(() => { if (activeTab === 'list_data') fetchTableData(); }, [activeTab, fetchTableData]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <TestPageLayout
      title={`Registrasi (${userRoleCategory})`}
      description="Sistem input data Layanan & Manajemen Klien."
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
      action={
        <Button
          variant="outline"
          onClick={() => { setOpenHistory(true); fetchHistory(); }}
          className="gap-2 bg-white hover:bg-slate-50 text-blue-700 border-blue-200 shadow-sm"
        >
          <History className="w-4 h-4" /> Riwayat Input
        </Button>
      }
    >
      <div className="w-full space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/80 rounded-xl">
            <TabsTrigger value="klien" className="py-3">{editingKlien ? 'Edit Klien' : '1. Data Klien'}</TabsTrigger>
            <TabsTrigger value="penjamin" className="py-3">2. Penjamin</TabsTrigger>
            <TabsTrigger value="layanan" className="py-3">{editingLayananId ? '3. Edit Layanan ✏️' : '3. Layanan'}</TabsTrigger>
            <TabsTrigger value="list_data" className="py-3 flex gap-2">Data Terdaftar</TabsTrigger>
          </TabsList>

          {/* TAB 1: KLIEN */}
          <TabsContent value="klien">
            <FormKlien 
              state={{ editingKlien, loading, isCategoryMismatch, matchesKlien, activeInput, namaAlias, refAgama, selectedAgama, kewarganegaraan, residivis, refPendidikan, selectedPendidikan, tglLahir, usiaWarning, hitungUsia, isOpAnak, isOpDewasa, hitungKategori, statusPerkawinan, refPekerjaan, selectedPekerjaan, refKelurahan, selectedKelurahan, manualKecamatan, perkaraList }} 
              handlers={{ initiateSaveKlien, setActiveInput, checkLiveDuplicate, handleEditClick, setMatchesKlien, handleAliasChange, handleAddAlias, handleRemoveAlias, setSelectedAgama, setKewarganegaraan, setResidivis, setSelectedPendidikan, handleDateChange, setStatusPerkawinan, setSelectedPekerjaan, handleSelectKelurahan, handleCancelButton, setOpenRiwayatKlien, handlePhoneValidation }} 
              components={{ SearchableSelect, SuggestionList }}
            />
          </TabsContent>

          {/* TAB 2: PENJAMIN */}
          <TabsContent value="penjamin">
            <FormPenjamin
              state={{ editingPenjamin, editingKlien, selectedClientId, matchesPenjamin, activeInput, listKlien, userRoleCategory, refHubungan, selectedHubungan, refAgama, selectedAgamaPenjamin, penjaminTglLahir, penjaminUsia, refPendidikan, selectedPendidikanPenjamin, refPekerjaan, selectedPekerjaanPenjamin, refKelurahan, selectedKelurahanPenjamin, manualKecamatanPenjamin, loading }}
              handlers={{ initiateSavePenjamin, checkLiveDuplicate, setActiveInput, setMatchesPenjamin, setSelectedClientId, handleCancelButton, setSelectedHubungan, setSelectedAgamaPenjamin, handlePenjaminDateChange, setSelectedPendidikanPenjamin, setSelectedPekerjaanPenjamin, handlePhoneValidation, handleSelectKelurahanPenjamin }}
              components={{ SearchableSelect, SuggestionList, ClientSelector }}
            />
          </TabsContent>

          {/* TAB 3: LAYANAN */}
          <TabsContent value="layanan">
            <Card className={cn("border-t-4 shadow-sm", editingLayananId ? "border-t-amber-500 bg-amber-50/30" : "border-t-blue-600")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{editingLayananId ? 'Edit Layanan Terdaftar' : 'Registrasi Layanan & Dokumen'}</CardTitle>
                    <CardDescription>
                      {editingLayananId
                        ? `Mengedit layanan ${editingLayananTable.toUpperCase()} — ID: ${editingLayananId}`
                        : 'Pilih layanan, upload surat permintaan, dan input perkara.'}
                    </CardDescription>
                  </div>
                  {editingLayananId && (
                    <Button variant="outline" size="sm" onClick={() => handleCancelButton(true)}>
                      <XCircle className="w-4 h-4 mr-2" /> Batal Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form
                  key={editingLitmas ? editingLitmas.id_litmas : 'litmas-new'}
                  onSubmit={initiateSaveLayanan}
                  className="space-y-6 mx-auto"
                >
                  {/* Sub-tab jenis layanan */}
                  <Tabs value={layananSubTab} onValueChange={setLayananSubTab} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-4 bg-blue-50/50 p-1 rounded-xl">
                      <TabsTrigger value="litmas" className="py-2">Litmas</TabsTrigger>
                      <TabsTrigger value="pendampingan" className="py-2">Pendampingan</TabsTrigger>
                      <TabsTrigger value="pengawasan" className="py-2">Pengawasan</TabsTrigger>
                      <TabsTrigger value="pembimbingan" className="py-2">Pembimbingan</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <ClientSelector
                      listKlien={listKlien}
                      selectedClientId={selectedClientId}
                      setSelectedClientId={setSelectedClientId}
                      editingKlien={editingKlien}
                      handleCancelButton={handleCancelButton}
                      loading={loading}
                      userRoleCategory={userRoleCategory}
                    />
                  </div>
                  
                  {selectedJenisLitmas && klienDitakPernahDitolak.some((l: any) => l.jenis_litmas === selectedJenisLitmas) && (
                    <Alert className="bg-amber-50 border-amber-300 text-amber-900 shadow-sm">
                      <AlertOctagon className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="font-bold">Usulan Pernah Ditolak</AlertTitle>
                      <AlertDescription className="text-xs mt-1 leading-relaxed">
                        Klien ini sebelumnya pernah mengajukan layanan <strong>{selectedJenisLitmas}</strong> dan ditolak pada sidang TPP.
                        Anda dapat mengajukannya ulang, namun pastikan persyaratan kali ini sudah terpenuhi dengan baik.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className={cn("space-y-6", !selectedClientId && "opacity-50 pointer-events-none")}>
                    {/* Tahapan & Jenis Layanan */}
                    <div className="grid gap-2 p-4 bg-blue-50/30 border border-blue-100 rounded-xl mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold text-blue-900">
                            Tahapan {layananSubTab.charAt(0).toUpperCase() + layananSubTab.slice(1)} <span className="text-red-500">*</span>
                          </Label>
                          <Select value={tahapanLayanan} onValueChange={(val: any) => setTahapanLayanan(val)} required>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Tahapan..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pra Adjudikasi">Pra Adjudikasi</SelectItem>
                              <SelectItem value="Adjudikasi">Adjudikasi</SelectItem>
                              <SelectItem value="Pasca Adjudikasi">Pasca Adjudikasi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold text-blue-900">
                            Jenis Layanan Tertentu <span className="text-red-500">*</span>
                          </Label>
                          <SearchableSelect 
                            options={currentJenisOptions} 
                            value={selectedJenisLitmas} 
                            onSelect={setSelectedJenisLitmas} 
                            labelKey="jenis" 
                            valueKey="jenis" 
                            placeholder={tahapanLayanan ? "Pilih Jenis..." : "Pilih Tahapan Dulu..."} 
                            searchPlaceholder="Cari jenis..." 
                            name="jenis_litmas" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload Surat Permintaan */}
                    <div className="space-y-4">
                      <Label className="font-bold text-blue-800">
                        Upload Surat Permintaan (Sesuai Layanan) {selectedUpt && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-blue-300 px-6 py-6 hover:bg-blue-50 hover:border-blue-400 transition-all relative cursor-pointer group">
                        <div className="text-center w-full">
                          {fileSuratPermintaan ? (
                            <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in-95">
                              <FileText className="mx-auto h-12 w-12" />
                              <span className="mt-2 block text-sm font-semibold">{fileSuratPermintaan.name}</span>
                              <span className="text-xs text-slate-500 bg-green-50 px-2 py-1 rounded-full mt-1">Siap diupload (Klik Simpan)</span>
                            </div>
                          ) : (editingLitmas && editingLitmas.file_surat_permintaan_url) ? (
                            <div className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-50/50 border border-blue-100">
                              <FileText className="h-10 w-10 text-blue-600 mb-2" />
                              <span className="text-sm font-bold text-slate-700">Surat Permintaan Tersimpan</span>
                              <div className="flex gap-2 mt-2 z-20 relative">
                                <Button
                                  type="button" size="sm" variant="outline" className="h-7 text-xs bg-white"
                                  onClick={(e) => { e.preventDefault(); window.open(editingLitmas.file_surat_permintaan_url, '_blank'); }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1"/> Lihat File
                                </Button>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-2 italic">Klik area ini untuk mengganti file</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                              <CloudUpload className="mx-auto h-12 w-12 mb-2" />
                              <span className="block text-sm font-semibold">Pilih File Surat Permintaan</span>
                              <span className="text-xs mt-1">PDF, JPG, PNG (Maks 5MB)</span>
                            </div>
                          )}
                        </div>
                        <Input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFileSuratPermintaan(e.target.files[0]);
                              toast({ title: "File Dipilih", description: e.target.files[0].name });
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <Separator />

                    {/* Input Perkara */}
                    <div className="space-y-4 bg-red-50 p-6 rounded-lg border border-red-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2">
                          <Gavel className="w-5 h-5" />Input Data Perkara
                        </h3>
                        <Badge variant="outline" className="bg-white text-red-600 border-red-200">
                          Total: {perkaraList.length} Kasus
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded shadow-sm">
                        <div className="md:col-span-3 grid gap-2">
                          <Label>Pilih Pasal (Dari Referensi)</Label>
                          <SearchableSelect
                            options={refPerkara.map(p => ({
                              id: String(p.id_perkara),
                              display: `Ps. ${p.pasal} ${p.aturan_uu || ''} - ${p.nama_perkara}`
                            }))}
                            value={(() => {
                              const found = refPerkara.find(p => p.pasal === tempPerkara.pasal && p.nama_perkara === tempPerkara.tindak_pidana);
                              return found ? String(found.id_perkara) : "";
                            })()}
                            onSelect={(val: string) => {
                              const sel = refPerkara.find(p => String(p.id_perkara) === val);
                              if (sel) {
                                setTempPerkara({ ...tempPerkara, pasal: sel.pasal || '', tindak_pidana: sel.nama_perkara || '' });
                              } else {
                                setTempPerkara({ ...tempPerkara, pasal: '', tindak_pidana: '' });
                              }
                            }}
                            labelKey="display"
                            valueKey="id"
                            placeholder="Cari Pasal..."
                            searchPlaceholder="Ketik nomor pasal..."
                            name="ref_perkara_select"
                          />
                        </div>
                        
                        <div className="md:col-span-2 grid gap-2">
                          <Label>Tindak Pidana</Label>
                          <Input
                            value={tempPerkara.tindak_pidana}
                            onChange={(e) => setTempPerkara({ ...tempPerkara, tindak_pidana: e.target.value })}
                            placeholder="Pencurian"
                          />
                        </div>

                        <div className="md:col-span-3 grid gap-2">
                          <Label>Juncto (Jo.)</Label>
                          <Input value={tempPerkara.juncto} onChange={(e) => setTempPerkara({ ...tempPerkara, juncto: e.target.value })} placeholder="Cth: Jo. Ps. 55" />
                        </div>
                        <div className="md:col-span-4 grid gap-2">
                          <Label>No. Putusan</Label>
                          <Input value={tempPerkara.nomor_putusan} onChange={(e) => setTempPerkara({ ...tempPerkara, nomor_putusan: e.target.value })} />
                        </div>
                        <div className="md:col-span-4 grid gap-2">
                          <Label>Vonis Pidana</Label>
                          <DurationInput label="Durasi Vonis" value={tempPerkara.vonis_pidana} onChange={(val) => setTempPerkara({ ...tempPerkara, vonis_pidana: val })} />
                        </div>
                        <div className="md:col-span-3 grid gap-2">
                          <Label>Denda (Rp)</Label>
                          <Input type="number" value={tempPerkara.denda} onChange={(e) => setTempPerkara({ ...tempPerkara, denda: e.target.value })} />
                        </div>
                        <div className="md:col-span-4 grid gap-2">
                          <Label>Subsider</Label>
                          <DurationInput label="Durasi Subsider" value={tempPerkara.subsider_pidana} onChange={(val) => setTempPerkara({ ...tempPerkara, subsider_pidana: val })} />
                        </div>
                        <div className="md:col-span-3 grid gap-2">
                          <Label>Uang Pengganti (Rp)</Label>
                          <Input type="number" value={tempPerkara.uang_pengganti} onChange={(e) => setTempPerkara({ ...tempPerkara, uang_pengganti: e.target.value })} placeholder="0" />
                        </div>
                        <div className="md:col-span-2 grid gap-2">
                          <Label>Restitusi (Rp)</Label>
                          <Input type="number" value={tempPerkara.restitusi} onChange={(e) => setTempPerkara({ ...tempPerkara, restitusi: e.target.value })} placeholder="0" />
                        </div>
                        <div className="md:col-span-2 grid gap-2">
                          <Label>Mulai Ditahan</Label>
                          <Input type="date" value={tempPerkara.tanggal_mulai_ditahan} onChange={(e) => setTempPerkara({ ...tempPerkara, tanggal_mulai_ditahan: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 grid gap-2">
                          <Label>Ekspirasi</Label>
                          <Input type="date" value={tempPerkara.tanggal_ekspirasi} onChange={(e) => setTempPerkara({ ...tempPerkara, tanggal_ekspirasi: e.target.value })} />
                        </div>
                        
                        <div className="md:col-span-1">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!tempPerkara.pasal || !tempPerkara.tindak_pidana) {
                                return toast({ variant: "destructive", title: "Gagal", description: "Pasal & Tindak Pidana wajib diisi." });
                              }
                              setPerkaraList([...perkaraList, { ...tempPerkara, id: Date.now() }]);
                              setTempPerkara({ pasal: '', tindak_pidana: '', juncto: '', nomor_putusan: '', vonis_pidana: '', denda: '', subsider_pidana: '', uang_pengganti: '', restitusi: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: '' });
                            }}
                            size="icon"
                            className="bg-red-600 hover:bg-red-700 w-full"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {perkaraList.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center justify-between bg-white p-3 rounded border border-red-200 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
                              <div>
                                <span className="text-xs text-slate-500 block">Pasal</span>
                                <span className="font-bold">{p.pasal}</span>
                                {p.juncto && <span className="text-xs text-slate-400 block">Jo. {p.juncto}</span>}
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Pidana</span>
                                <span>{p.tindak_pidana}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Vonis</span>
                                <span>{p.vonis_pidana}</span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Uang Pengganti</span>
                                <span className="text-orange-600 font-medium">
                                  {p.uang_pengganti ? `Rp ${Number(p.uang_pengganti).toLocaleString('id-ID')}` : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Ekspirasi</span>
                                <span className="text-red-600 font-medium">{p.tanggal_ekspirasi || '-'}</span>
                              </div>
                            </div>
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => {
                                const newList = [...perkaraList];
                                newList.splice(idx, 1);
                                setPerkaraList(newList);
                              }}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {perkaraList.length === 0 && (
                          <p className="text-center text-sm text-red-400 italic">Belum ada data perkara ditambahkan.</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Form spesifik per sub-layanan */}
                    <div className="mt-6">
                      {layananSubTab === 'litmas' && (
                        <FormLitmas 
                          editingLitmas={editingLitmas}
                          refJenisLitmas={refJenisLitmas}
                          refUpt={refUpt}
                          refBapas={refBapas}
                          selectedJenisLitmas={selectedJenisLitmas}
                          setSelectedJenisLitmas={setSelectedJenisLitmas}
                          selectedUpt={selectedUpt}
                          setSelectedUpt={setSelectedUpt}
                          selectedBapas={selectedBapas}
                          setSelectedBapas={setSelectedBapas}
                          nomorUrutLayanan={nomorUrutLayanan}
                          setNomorUrutLayanan={setNomorUrutLayanan}
                          SearchableSelect={SearchableSelect}
                        />
                      )}
                      {layananSubTab === 'pendampingan' && (
                        <FormPendampingan 
                          editingLitmas={editingLitmas}
                          refUpt={refUpt}
                          selectedUpt={selectedUpt}
                          setSelectedUpt={setSelectedUpt}
                          nomorUrutLayanan={nomorUrutLayanan}
                          setNomorUrutLayanan={setNomorUrutLayanan}
                          SearchableSelect={SearchableSelect}
                        />
                      )}
                      {layananSubTab === 'pengawasan' && (
                        <FormPengawasan 
                          editingLitmas={editingLitmas}
                          nomorUrutLayanan={nomorUrutLayanan}
                          setNomorUrutLayanan={setNomorUrutLayanan}
                        />
                      )}
                      {layananSubTab === 'pembimbingan' && (
                        <FormPembimbingan 
                          editingLitmas={editingLitmas}
                          nomorUrutLayanan={nomorUrutLayanan}
                          setNomorUrutLayanan={setNomorUrutLayanan}
                        />
                      )}
                    </div>

                    {/* Tunjuk Petugas PK */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-blue-900 font-bold flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> Tunjuk Petugas PK
                        </Label>
                        <Popover open={openPkCombo} onOpenChange={setOpenPkCombo}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline" role="combobox" aria-expanded={openPkCombo}
                              className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 h-auto py-2 text-left"
                            >
                              {listPK.find((pk) => pk.id === selectedPkId) ? (
                                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                                  <span className="font-semibold text-slate-900 truncate w-full">{listPK.find((pk) => pk.id === selectedPkId)?.nama}</span>
                                  <span className="text-xs text-slate-500 truncate w-full">NIP: {listPK.find((pk) => pk.id === selectedPkId)?.nip}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500">Pilih Petugas PK...</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari PK..." />
                              <CommandList>
                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {listPK.map((pk) => (
                                    <CommandItem
                                      key={pk.id}
                                      value={`${pk.nama} ${pk.nip}`}
                                      onSelect={() => { setSelectedPkId(pk.id); setOpenPkCombo(false); }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", selectedPkId === pk.id ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{pk.nama}</span>
                                        <span className="text-xs text-muted-foreground">NIP: {pk.nip}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading || loading}>
                        {isUploading
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload...</>
                          : loading
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                          : "Simpan Layanan & Dokumen"
                        }
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: LIST DATA */}
          <TabsContent value="list_data">
            <DataTerdaftar 
              state={{ dataKlienFull, dataLitmas, loading, searchKlienQuery, searchLitmasQuery, userRoleCategory }}
              handlers={{ setSearchKlienQuery, handleSearchKlien, fetchTableData, setDetailData, setOpenDetail, handleEditClick, setSearchLitmasQuery, handleSearchLitmas, setSelectedLitmasDetail, setOpenLitmasDetail, handleEditLayananClick }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== MODALS & DIALOGS ===== */}

      {/* 1. Dialog Detail Klien */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-4">Data Diri Utama</h4>
                  <div className="grid grid-cols-3 gap-y-3 text-sm">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2 font-semibold">: {detailData?.nama_klien || '-'}</span>
                    <span className="text-slate-500">NIK</span>
                    <span className="col-span-2 font-mono">: {detailData?.nik_klien || '-'}</span>
                    <span className="text-slate-500">No. Register</span>
                    <span className="col-span-2 font-mono text-blue-600 font-bold">: {detailData?.nomor_register_lapas || '-'}</span>
                    <span className="text-slate-500">JK / Usia</span>
                    <span className="col-span-2">: {detailData?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} / {detailData?.usia || '0'} Tahun</span>
                    <span className="text-slate-500">Kategori</span>
                    <span className="col-span-2 flex items-center gap-2">: <Badge variant="outline" className="bg-blue-50">{detailData?.kategori_usia || '-'}</Badge></span>
                    <span className="text-slate-500">Pendidikan</span>
                    <span className="col-span-2">: {detailData?.pendidikan || '-'}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-green-500 pl-3 mb-4">Kontak & Domisili</h4>
                  <div className="grid grid-cols-3 gap-y-3 text-sm">
                    <span className="text-slate-500">No. Telepon</span>
                    <span className="col-span-2 font-semibold text-green-700">: {detailData?.nomor_telepon || '-'}</span>
                    <span className="text-slate-500">Kelurahan</span>
                    <span className="col-span-2">: {detailData?.kelurahan || '-'}</span>
                    <span className="text-slate-500">Kecamatan</span>
                    <span className="col-span-2">: {detailData?.kecamatan || '-'}</span>
                    <span className="text-slate-500 flex items-start">Alamat</span>
                    <span className="col-span-2 text-xs leading-relaxed italic">: {detailData?.alamat || '-'}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-purple-500 pl-3 mb-4">Keluarga Penjamin</h4>
                  {detailData?.penjamin && detailData.penjamin.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="flex flex-col md:flex-row md:justify-between border-b pb-2 gap-1">
                        <span className="text-slate-500 w-1/3">Nama Penjamin</span>
                        <span className="font-semibold text-slate-800 w-2/3">{detailData.penjamin[0].nama_penjamin}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:justify-between border-b pb-2 gap-1">
                        <span className="text-slate-500 w-1/3">Hubungan</span>
                        <span className="w-2/3">{detailData.penjamin[0].hubungan_klien}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:justify-between border-b pb-2 gap-1">
                        <span className="text-slate-500 w-1/3">No. Telepon</span>
                        <span className="text-green-700 font-bold w-2/3">{detailData.penjamin[0].nomor_telepon}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:justify-between pb-1 gap-1">
                        <span className="text-slate-500 w-1/3">Pekerjaan</span>
                        <span className="w-2/3">{detailData.penjamin[0].pekerjaan}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-slate-400">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs italic">Data penjamin belum tersedia untuk klien ini.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 h-full">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-6 flex gap-3 items-start">
                    <History className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Log Aktivitas Data</p>
                      <p className="text-xs text-amber-700 mt-1">Menampilkan perubahan yang dilakukan oleh sistem.</p>
                    </div>
                  </div>
                  <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8 pb-4">
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 bg-green-500 rounded-full w-5 h-5 border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Input Awal</p>
                      <p className="text-sm font-semibold text-slate-800">Data Klien Didaftarkan</p>
                      <p className="text-xs text-slate-500 mt-1">Sistem mencatat registrasi awal klien pada database Monalisa.</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(detailData?.created_at)}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 bg-blue-500 rounded-full w-5 h-5 border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Pembaruan</p>
                      <p className="text-sm font-semibold text-slate-800">Update Data Terakhir</p>
                      <p className="text-xs text-slate-500 mt-1">Perubahan pada field profil atau sinkronisasi data.</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{detailData?.updated_at ? formatDateTime(detailData.updated_at) : 'Belum ada update data'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-medium">Mengambil data komprehensif...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 2. Dialog Detail Layanan */}
      <Dialog open={openLitmasDetail} onOpenChange={setOpenLitmasDetail}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50/50">
          <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-orange-500" /> Detail Registrasi Layanan
            </DialogTitle>
          </DialogHeader>
          
          {selectedLitmasDetail ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-orange-500 pl-3 mb-5">Informasi Layanan</h4>
                  
                  <div className="flex justify-between items-start bg-orange-50/50 p-4 rounded-lg border border-orange-100 mb-5">
                    <div>
                      <p className="text-xs text-orange-600 uppercase font-bold tracking-tighter">Nomor Surat Permintaan</p>
                      <h3 className="text-lg font-mono font-bold text-slate-800">{selectedLitmasDetail.nomor_surat_permintaan}</h3>
                      <p className="text-sm text-slate-600 mt-1">Tanggal: {selectedLitmasDetail.tanggal_surat_permintaan}</p>
                    </div>
                    <Badge className={cn("text-sm px-3 py-1", selectedLitmasDetail.status === 'Selesai' ? "bg-green-600" : "bg-blue-600")}>
                      {selectedLitmasDetail.status || 'New Task'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-y-3 text-sm">
                    <div className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-500 w-1/3">Jenis Layanan</span>
                      <span className="font-semibold text-blue-700 w-2/3">: {selectedLitmasDetail.jenis_litmas}</span>
                    </div>
                    <div className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-500 w-1/3">Kategori</span>
                      <span className="capitalize w-2/3">: {selectedLitmasDetail.kategori_layanan || 'Litmas'}</span>
                    </div>
                    <div className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-500 w-1/3">Tahapan</span>
                      <span className="font-medium text-orange-700 w-2/3">: {selectedLitmasDetail.tahapan_layanan || '-'}</span>
                    </div>
                    <div className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-500 w-1/3">Petugas PK</span>
                      <span className="font-semibold text-slate-800 w-2/3">: {selectedLitmasDetail.petugas_pk?.nama || 'Belum Ditunjuk'}</span>
                    </div>
                    <div className="flex border-b border-slate-100 pb-2">
                      <span className="text-slate-500 w-1/3">Asal UPT/Bapas</span>
                      <span className="w-2/3">: {selectedLitmasDetail.ref_upt?.nama_upt || selectedLitmasDetail.asal_bapas || '-'}</span>
                    </div>
                    <div className="flex pb-1">
                      <span className="text-slate-500 w-1/3">Waktu Reg.</span>
                      <span className="text-xs text-slate-600 w-2/3 flex items-center gap-1">
                        <Clock className="w-3 h-3"/>: {formatDateTime(selectedLitmasDetail.waktu_registrasi)}
                      </span>
                    </div>
                  </div>

                  {selectedLitmasDetail.file_surat_permintaan_url && (
                    <div className="pt-5 mt-4 border-t border-slate-100">
                      <Button
                        variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(selectedLitmasDetail.file_surat_permintaan_url, '_blank')}
                      >
                        <FileText className="w-4 h-4" /> Buka Dokumen Surat Permintaan
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-5">Data Klien Terkait</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 block">Nama Lengkap</span>
                      <span className="font-semibold block">{selectedLitmasDetail.klien?.nama_klien || '-'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 block">No. Register Lapas</span>
                      <span className="font-mono font-bold text-blue-600 block">{selectedLitmasDetail.klien?.nomor_register_lapas || '-'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 block">Kategori & Usia</span>
                      <span className="block flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-50">{selectedLitmasDetail.klien?.kategori_usia || '-'}</Badge>
                        {selectedLitmasDetail.klien?.usia ? `${selectedLitmasDetail.klien.usia} Thn` : '-'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 block">No. Telepon</span>
                      <span className="text-green-700 font-semibold block">{selectedLitmasDetail.klien?.nomor_telepon || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 h-full">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
                  <h4 className="text-sm font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-3">
                    <History className="w-5 h-5 text-blue-600"/> Riwayat Proses Layanan
                  </h4>
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                    {[
                      { date: selectedLitmasDetail?.waktu_registrasi, label: "Registrasi & Penunjukan PK", color: "bg-green-500", text: "text-slate-800" },
                      { date: selectedLitmasDetail?.waktu_upload_surat_tugas, label: "PK: Upload Surat Tugas", color: "bg-green-500", text: "text-slate-800" },
                      { date: selectedLitmasDetail?.waktu_upload_laporan, label: "PK: Upload Laporan", color: "bg-green-500", text: "text-slate-800" },
                      { date: selectedLitmasDetail?.waktu_verifikasi_anev, label: "Anev: Verifikasi & Approval", color: "bg-green-500", text: "text-slate-800" },
                      { date: selectedLitmasDetail?.waktu_sidang_tpp || selectedLitmasDetail?.tanggal_sidang_tpp, label: "TPP: Sidang Dilaksanakan", color: "bg-purple-600", text: "text-slate-800" },
                      { date: selectedLitmasDetail?.waktu_selesai, label: "Selesai", color: "bg-blue-600", text: "text-blue-700" },
                    ].map((item, idx) => (
                      <div key={idx} className="ml-8 relative group">
                        <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${item.date ? item.color : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                        <div className={!item.date ? 'opacity-50 grayscale' : ''}>
                          <p className={`text-sm font-bold ${item.text}`}>{item.label}</p>
                          <p className="text-[11px] text-slate-500 mt-1 font-mono bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                            {item.date ? formatDateTime(item.date) : 'Menunggu Proses'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Sheet Riwayat */}
      <Sheet open={openHistory} onOpenChange={setOpenHistory}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Riwayat Input Baru</SheetTitle>
            <SheetDescription>Aktivitas 7 hari terakhir.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {loadingHistory ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : historyData.length === 0 ? (
              <p className="text-center text-sm text-slate-400 italic py-8">Belum ada aktivitas dalam 7 hari terakhir.</p>
            ) : (
              historyData.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", h.type === 'Klien Baru' ? 'bg-green-500' : 'bg-blue-500')} />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">{h.type}</p>
                    <p className="text-sm font-medium text-slate-800">{h.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(h.date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Confirm Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent className="border-l-4 border-l-blue-600">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penyimpanan</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.warningMessage || "Pastikan semua data sudah benar sebelum menyimpan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeSave}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TestPageLayout>
  );
}