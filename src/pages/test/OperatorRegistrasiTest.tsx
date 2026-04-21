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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardList, Gavel, CalendarDays, Loader2, Check, ChevronsUpDown, Search, 
  User, UserCheck, List, RefreshCw, Pencil, XCircle, MapPin, AlertTriangle, 
  Eye, FileText, ShieldAlert, Plus, Trash2, Phone, Briefcase, GraduationCap, AlertCircle, Save,
  CloudUpload, History, Clock, ExternalLink, Activity, Globe, FileClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// --- IMPORTS DARI FILE LAIN ---
import { DurationInput } from '@/components/registrasi/Features/DurationInput';
import { SuggestionList } from '@/components/registrasi/Features/SuggestionList';
import { ClientSelector } from '@/components/registrasi/Features/ClientSelector';
import { PetugasPK, Klien } from '@/types/auth'; 
import { Database } from '@/integrations/supabase/types';

// --- IMPORTS KOMPONEN LAYANAN YANG SUDAH DIPISAH ---
import { FormLitmas } from '@/components/registrasi/FormLayanan/FormLitmas';
import { FormPendampingan } from '@/components/registrasi/FormLayanan/FormPendampingan';
import { FormPengawasan } from '@/components/registrasi/FormLayanan/FormPengawasan';
import { FormPembimbingan } from '@/components/registrasi/FormLayanan/FormPembimbingan';

// --- HIERARKI LAYANAN ---
export const HIERARKI_LAYANAN = {
  litmas: {
    "Pra Adjudikasi": ["Litmas RJ", "Litmas Diversi", "Litmas Sidang", "Litmas Perawatan", "Litmas Penempatan"],
    "Adjudikasi": ["Litmas Sidang", "Litmas Perawatan", "Litmas Penempatan"],
    "Pasca Adjudikasi": ["Litmas Awal", "Litmas Integrasi", "Litmas Mutasi", "Litmas Grasi", "Litmas Perubahan Pidana", "Litmas Bimbingan"]
  },
  pendampingan: {
    "Pra Adjudikasi": ["BAP", "P21", "Mediasi"],
    "Adjudikasi": ["Sidang"],
    "Pasca Adjudikasi": [] 
  },
  pembimbingan: {
    "Pra Adjudikasi": ["Fasilitasi (bantuan hukum/Kesehatan/psikologis)"],
    "Adjudikasi": ["Fasilitasi (bantuan hukum/Kesehatan/psikologis)"],
    "Pasca Adjudikasi": ["Fasilitasi (bantuan hukum/Kesehatan/psikologis)", "Kepribadian/Kemandirian", "Pindah Bimbingan"]
  },
  pengawasan: {
    "Pra Adjudikasi": ["Monitoring Pelaksanaan RJ/Diversi"],
    "Adjudikasi": ["Monitoring Pelaksanaan RJ/Diversi", "Monitoring Pelaksaan Perawatan Tahanan dan Penempatan Tahanan"],
    "Pasca Adjudikasi": ["Monitoring Program Pembinaan awal", "Monitoring Program Pembimbingan"]
  }
};

// --- TYPE DEFINITIONS FOR REFERENCES ---
type RefAgama = Database['public']['Tables']['ref_agama']['Row'];
type RefPendidikan = Database['public']['Tables']['ref_pendidikan']['Row'];
type RefPekerjaan = Database['public']['Tables']['ref_pekerjaan']['Row'];
type RefHubungan = Database['public']['Tables']['ref_hubungan']['Row'];
type RefUpt = Database['public']['Tables']['ref_upt']['Row'];
type RefJenisLitmas = Database['public']['Tables']['ref_jenis_litmas']['Row'];
type RefBapas = Database['public']['Tables']['ref_bapas']['Row'];

interface RefKelurahanExtended { 
  id_kelurahan: number; 
  nama_kelurahan: string; 
  kecamatan_id: number | null;
  ref_kecamatan: {
      nama_kecamatan: string;
  } | null;
}

// --- REUSABLE COMPONENT: SEARCHABLE COMBOBOX ---
export const SearchableSelect = ({ 
  options, value, onSelect, labelKey, valueKey, placeholder, searchPlaceholder, name 
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

  // --- STATE LAYANAN & TAHAPAN ---
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

  // State Data Operasional
  const [listKlien, setListKlien] = useState<Klien[]>([]);
  const [dataLitmas, setDataLitmas] = useState<any[]>([]);
  const [dataKlienFull, setDataKlienFull] = useState<any[]>([]);

  // Selection & Forms
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [originalPkId, setOriginalPkId] = useState<string | null>(null);
  const [openPkCombo, setOpenPkCombo] = useState(false);

  // Klien
  const [namaAlias, setNamaAlias] = useState<string[]>(['']);
  const [kewarganegaraan, setKewarganegaraan] = useState("WNI");
  const [residivis, setResidivis] = useState("Tidak");
  const [statusPerkawinan, setStatusPerkawinan] = useState("");
  const [selectedAgama, setSelectedAgama] = useState<string>("");
  const [selectedPendidikan, setSelectedPendidikan] = useState<string>("");
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<string>("");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("");
  const [manualKecamatan, setManualKecamatan] = useState<string>("");
  
  // Penjamin
  const [selectedHubungan, setSelectedHubungan] = useState<string>("");
  const [selectedAgamaPenjamin, setSelectedAgamaPenjamin] = useState<string>("");
  const [selectedPendidikanPenjamin, setSelectedPendidikanPenjamin] = useState<string>("");
  const [selectedPekerjaanPenjamin, setSelectedPekerjaanPenjamin] = useState<string>("");
  const [selectedKelurahanPenjamin, setSelectedKelurahanPenjamin] = useState<string>(""); 
  const [manualKecamatanPenjamin, setManualKecamatanPenjamin] = useState<string>("");
  const [penjaminTglLahir, setPenjaminTglLahir] = useState("");
  const [penjaminUsia, setPenjaminUsia] = useState("");

  // Layanan
  const [selectedJenisLitmas, setSelectedJenisLitmas] = useState<string>("");
  const [selectedUpt, setSelectedUpt] = useState<string>("");
  const [selectedBapas, setSelectedBapas] = useState<string>("Bapas Kelas I Jakarta Barat"); 
  const [nomorUrutLayanan, setNomorUrutLayanan] = useState("");

  // Edit Mode States
  const [editingKlien, setEditingKlien] = useState<any | null>(null);
  const [editingPenjamin, setEditingPenjamin] = useState<any | null>(null);
  const [editingLitmas, setEditingLitmas] = useState<any | null>(null);
  
  // Validasi & Hitungan
  const [tglLahir, setTglLahir] = useState("");
  const [hitungUsia, setHitungUsia] = useState("");
  const [hitungKategori, setHitungKategori] = useState("");
  const [usiaWarning, setUsiaWarning] = useState<string | null>(null);
  const [isCategoryMismatch, setIsCategoryMismatch] = useState(false);
  
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

  // Perkara & File Upload
  const [perkaraList, setPerkaraList] = useState<any[]>([]);
  const [tempPerkara, setTempPerkara] = useState({
      pasal: '', tindak_pidana: '', nomor_putusan: '', 
      vonis_pidana: '', denda: '', subsider_pidana: '',
      tanggal_mulai_ditahan: '', tanggal_ekspirasi: ''
  });
  const [fileSuratPermintaan, setFileSuratPermintaan] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; type: 'klien' | 'penjamin' | 'layanan' | null; payload: any | null; warningMessage?: string | null; }>({ isOpen: false, type: null, payload: null, warningMessage: null });
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicatePayload, setDuplicatePayload] = useState<any>(null); 

  // --- LOGIC HIERARKI LAYANAN ---
  useEffect(() => {
    setSelectedJenisLitmas("");
  }, [layananSubTab, tahapanLayanan]);

  const currentJenisOptions = (tahapanLayanan && layananSubTab) 
      // @ts-ignore
      ? (HIERARKI_LAYANAN[layananSubTab]?.[tahapanLayanan] || []).map((j: string) => ({ jenis: j }))
      : [];

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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

  const refreshEditData = async (idKlien: number) => {
    try {
        const { data, error } = await supabase.from('klien').select(`*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))`).eq('id_klien', idKlien).single();
        if (error) throw error;
        const safeData = data as any;
        setEditingKlien(safeData);
        setEditingPenjamin(safeData.penjamin?.[0] || null);
        const firstLitmas = safeData.litmas?.[0] || null;
        setEditingLitmas(firstLitmas);
        setPerkaraList(firstLitmas?.perkara || []);
    } catch (error) { console.error("Gagal refresh data:", error); }
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
    if (isOpAnak && age >= 18) { setUsiaWarning("BLOCK: Usia >= 18 Tahun. Anda login sebagai Operator Anak."); mismatch = true; }
    else if (isOpDewasa && age < 18) { setUsiaWarning("BLOCK: Usia < 18 Tahun. Anda login sebagai Operator Dewasa."); mismatch = true; }
    else { setUsiaWarning(null); mismatch = false; }
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
    const { data: kel } = await supabase.from('ref_kelurahan').select(`id_kelurahan, nama_kelurahan, kecamatan_id, ref_kecamatan ( nama_kecamatan )`).limit(2000); 
    if (kel) setRefKelurahan(kel as unknown as RefKelurahanExtended[]);

    let queryKlien = supabase.from('klien').select('id_klien, nama_klien, nomor_register_lapas').order('id_klien', { ascending: false });
    if (isOpAnak) queryKlien = queryKlien.eq('kategori_usia', 'Anak');
    else if (isOpDewasa) queryKlien = queryKlien.eq('kategori_usia', 'Dewasa');
    const { data: k } = await queryKlien;
    if (k) setListKlien(k as unknown as Klien[]);
  }, [isOpAnak, isOpDewasa]);

  const fetchTableData = useCallback(async () => {
    setLoading(true);
    try {
      let qK = supabase.from('klien')
        .select('*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))') 
        .order('id_klien', { ascending: false })
        .limit(20);
      if (isOpAnak) qK = qK.eq('kategori_usia', 'Anak');
      else if (isOpDewasa) qK = qK.eq('kategori_usia', 'Dewasa');
      
      const { data: kData, error: kError } = await qK;
      if (kError) console.error("Error fetching klien list:", kError);
      setDataKlienFull(kData || []);
      
      const { data: lData } = await supabase.from('litmas').select(`*, klien:klien!fk_litmas_klien (nama_klien), petugas_pk:petugas_pk!fk_litmas_pk (nama, nip), ref_upt(nama_upt)`).order('id_litmas', { ascending: false }).limit(20);
      setDataLitmas(lData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [isOpAnak, isOpDewasa]);

  const fetchHistory = useCallback(async () => {
      setLoadingHistory(true);
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const historyArr: any[] = [];
      try {
          const { data: kData } = await supabase.from('klien').select('id_klien, nama_klien, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false });
          kData?.forEach((k: any) => historyArr.push({ type: 'Klien Baru', title: k.nama_klien, date: k.created_at, id: k.id_klien }));
          const { data: pData } = await supabase.from('penjamin').select('id_klien, nama_penjamin, created_at').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false });
          pData?.forEach((p: any) => historyArr.push({ type: 'Penjamin', title: p.nama_penjamin, date: p.created_at, id: p.id_klien }));
          const { data: lData } = await supabase.from('litmas').select('id_litmas, nomor_surat_permintaan, waktu_registrasi, klien:klien!fk_litmas_klien(nama_klien)').gte('waktu_registrasi', sevenDaysAgo).order('waktu_registrasi', { ascending: false });
          lData?.forEach((l: any) => historyArr.push({ type: 'Registrasi Layanan', title: `${l.nomor_surat_permintaan} (${l.klien?.nama_klien || 'N/A'})`, date: l.waktu_registrasi, id: l.id_litmas }));
          historyArr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setHistoryData(historyArr);
      } catch(err) { console.error(err); } finally { setLoadingHistory(false); }
  }, []);

  const handleEditClick = async (item: any) => {
    setLoading(true); setMatchesKlien([]); setActiveInput(null);
    try {
        const { data, error } = await supabase.from('klien').select(`*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))`).eq('id_klien', item.id_klien).single();
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
            if (pjn.tanggal_lahir) {
                const birthDate = new Date(pjn.tanggal_lahir);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                setPenjaminUsia(age.toString());
            } else {
                setPenjaminUsia(pjn.usia ? String(pjn.usia) : "");
            }

            if (pjn.kelurahan) handleSelectKelurahanPenjamin(pjn.kelurahan);
            else { setSelectedKelurahanPenjamin(""); setManualKecamatanPenjamin(""); }
        } else {
            setSelectedHubungan(""); setSelectedAgamaPenjamin(""); setSelectedPendidikanPenjamin(""); setSelectedPekerjaanPenjamin("");
            setSelectedKelurahanPenjamin(""); setManualKecamatanPenjamin("");
            setPenjaminTglLahir(""); setPenjaminUsia("");
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
        } else {
            setSelectedPkId(null); setOriginalPkId(null);
            setSelectedJenisLitmas(""); setSelectedUpt(""); setSelectedBapas("");
            setTahapanLayanan(""); setLayananSubTab("litmas");
            setNomorUrutLayanan("");
        }

        setSelectedClientId(safeData.id_klien);
        
        if(safeData.tanggal_lahir) {
             setTglLahir(safeData.tanggal_lahir);
             calculateAgeAndCategory(safeData.tanggal_lahir);
        }

        setActiveTab("klien");
        toast({ title: "Mode Edit Aktif", description: `Mengedit data: ${safeData.nama_klien}` });
    } catch (error: any) { toast({ variant: "destructive", title: "Gagal load data", description: error.message }); } 
    finally { setLoading(false); }
  };

  const resetFormState = () => {
    setEditingKlien(null); setEditingPenjamin(null); setEditingLitmas(null);
    setPerkaraList([]); setSelectedClientId(null); setSelectedPkId(null); setOriginalPkId(null);
    setMatchesKlien([]); setMatchesPenjamin([]); setActiveInput(null); setFileSuratPermintaan(null);
    setTglLahir(""); setHitungUsia(""); setHitungKategori("");
    setTempPerkara({ pasal: '', tindak_pidana: '', nomor_putusan: '', vonis_pidana: '', denda: '', subsider_pidana: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: '' });
    
    setNamaAlias(['']); setKewarganegaraan("WNI"); setResidivis("Tidak"); setStatusPerkawinan("");
    setSelectedAgama(""); setSelectedPendidikan(""); setSelectedPekerjaan("");
    setSelectedKelurahan(""); setManualKecamatan("");
    
    setSelectedHubungan(""); setSelectedAgamaPenjamin(""); setSelectedPendidikanPenjamin(""); setSelectedPekerjaanPenjamin("");
    setSelectedKelurahanPenjamin(""); setManualKecamatanPenjamin("");
    setPenjaminTglLahir(""); setPenjaminUsia("");
    
    setSelectedJenisLitmas(""); setSelectedUpt(""); setSelectedBapas("Bapas Kelas I Jakarta Barat");
    setTahapanLayanan(""); setLayananSubTab("litmas"); setNomorUrutLayanan("");
  };

  const handleCancelButton = (showToast = true) => { resetFormState(); if (showToast) toast({ title: "Edit Dibatalkan", description: "Form direset." }); };

  const refreshEditDataOnly = async (idKlien: number) => {
    try {
        const { data, error } = await supabase.from('klien').select(`*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))`).eq('id_klien', idKlien).single();
        if (error) throw error;
        const safeData = data as any;
        setEditingKlien(safeData);
        setEditingPenjamin(safeData.penjamin?.[0] || null);
        const firstLitmas = safeData.litmas?.[0] || null;
        setEditingLitmas(firstLitmas);
        setPerkaraList(firstLitmas?.perkara || []);
    } catch (error) { console.error("Gagal refresh data:", error); }
  };

  // --- AUTO FILL DATA KETIKA KLIEN DIPILIH ---
  useEffect(() => {
    if (!selectedClientId) return;

    const fetchExistingData = async () => {
      try {
        // --- 1. Fetch Penjamin Existing ---
        const { data: penjaminData } = await supabase.from('penjamin').select('*').eq('id_klien', selectedClientId).maybeSingle();
        
        if (penjaminData) {
          if (editingPenjamin && editingPenjamin.id_klien === penjaminData.id_klien) {
              // skip
          } else {
              setEditingPenjamin(penjaminData);
              setSelectedHubungan(penjaminData.hubungan_klien || "");
              setSelectedAgamaPenjamin(penjaminData.agama || "");
              setSelectedPendidikanPenjamin(penjaminData.pendidikan || "");
              setSelectedPekerjaanPenjamin(penjaminData.pekerjaan || "");
              setPenjaminTglLahir(penjaminData.tanggal_lahir || "");
              
              if (penjaminData.tanggal_lahir) {
                const birthDate = new Date(penjaminData.tanggal_lahir);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                setPenjaminUsia(age.toString());
              } else {
                setPenjaminUsia(penjaminData.usia ? String(penjaminData.usia) : "");
              }

              if (penjaminData.kelurahan) {
                setSelectedKelurahanPenjamin(penjaminData.kelurahan);
                const selected = refKelurahan.find(k => k.nama_kelurahan === penjaminData.kelurahan);
                setManualKecamatanPenjamin(selected ? (selected.ref_kecamatan?.nama_kecamatan || "") : "");
              } else {
                setSelectedKelurahanPenjamin("");
                setManualKecamatanPenjamin("");
              }

              toast({ title: "Info", description: "Data penjamin untuk klien ini ditemukan dan diisi otomatis." });
          }
        } else {
          if (!editingKlien) {
            setEditingPenjamin(null);
            setSelectedHubungan(""); setSelectedAgamaPenjamin(""); setSelectedPendidikanPenjamin(""); setSelectedPekerjaanPenjamin("");
            setSelectedKelurahanPenjamin(""); setManualKecamatanPenjamin("");
            setPenjaminTglLahir(""); setPenjaminUsia("");
          }
        }

        // --- 2. Fetch PK Sebelumnya ---
        // Jika sedang membuat layanan baru (editingLitmas kosong)
        if (!editingLitmas || editingLitmas.id_klien !== selectedClientId) {
           const { data: latestLitmas } = await supabase
             .from('litmas')
             .select('nama_pk')
             .eq('id_klien', selectedClientId)
             .not('nama_pk', 'is', null)
             .order('id_litmas', { ascending: false })
             .limit(1)
             .maybeSingle();

           if (latestLitmas && latestLitmas.nama_pk) {
             setSelectedPkId(latestLitmas.nama_pk);
             // Jangan spam toast jika sedang mode edit penuh dari tabel
             if (!editingKlien) {
               toast({ title: "Petugas PK Ditemukan", description: "Petugas PK disesuaikan otomatis dari riwayat layanan sebelumnya." });
             }
           }
        }

      } catch (error) {
        console.error("Gagal memuat otomatis data penjamin/PK:", error);
      }
    };

    fetchExistingData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const handleSearchKlien = async () => {
      if(!searchKlienQuery) return fetchTableData();
      setLoading(true);
      const { data, error } = await supabase.from('klien')
        .select('*, penjamin (*), litmas:litmas!fk_litmas_klien (*, perkara (*))') 
        .ilike('nama_klien', `%${searchKlienQuery}%`)
        .limit(20);
      if (error) console.error("Error search klien:", error);
      setDataKlienFull(data || []);
      setLoading(false);
  };

  const handleSearchLitmas = async () => {
      if(!searchLitmasQuery) return fetchTableData();
      setLoading(true);
      const { data } = await supabase.from('litmas').select(`*, klien:klien!fk_litmas_klien (nama_klien, nomor_register_lapas), petugas_pk:petugas_pk!fk_litmas_pk (nama, nip)`).ilike('nomor_surat_permintaan', `%${searchLitmasQuery}%`).limit(20);
      setDataLitmas(data || []);
      setLoading(false);
  };

  const uploadSuratPermintaan = async (file: File, namaKlien: string) => {
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

  const executeSave = async () => {
      setConfirmDialog(prev => ({ ...prev, isOpen: false })); setLoading(true);
      const { type, payload } = confirmDialog;
      const formData = payload as FormData;

      try {
          if (type === 'klien') {
              const kategoriFix = isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori);
              const dataKlien = {
                nik_klien: formData.get('nik_klien') as string, 
                nama_klien: formData.get('nama_klien') as string,
                nomor_register_lapas: formData.get('nomor_register_klien') as string, 
                jenis_kelamin: formData.get('jenis_kelamin') as string,
                agama: formData.get('agama') as string, 
                pendidikan: formData.get('pendidikan') as string,
                tempat_lahir: formData.get('tempat_lahir') as string, 
                tanggal_lahir: (formData.get('tanggal_lahir') as string),
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
                nama_alias: namaAlias.filter(n => n.trim() !== '')
              };

              if (editingKlien) {
                  const { error } = await supabase.from('klien').update(dataKlien).eq('id_klien', editingKlien.id_klien);
                  if (error) throw error;
                  await refreshEditDataOnly(editingKlien.id_klien);
                  toast({ title: "Berhasil", description: "Perubahan data Klien disimpan." });
                  setActiveTab("penjamin");
              } else {
                  const { data: newKlien, error } = await supabase.from('klien').insert(dataKlien).select('id_klien').single();
                  if (error) throw error;
                  setSelectedClientId(newKlien.id_klien);
                  toast({ title: "Berhasil", description: "Data Klien Disimpan. Lanjut ke Penjamin." });
                  setActiveTab("penjamin");
                  fetchReferences();
              }
          } else if (type === 'penjamin') {
              const dataPenjamin = {
                  id_klien: selectedClientId, nama_penjamin: formData.get('nama_penjamin') as string, nik_penjamin: formData.get('nik_penjamin') as string,
                  hubungan_klien: formData.get('hubungan_klien') as string, agama: formData.get('agama') as string, tempat_lahir: formData.get('tempat_lahir') as string,
                  tanggal_lahir: (formData.get('tanggal_lahir') as string) || null, usia: Number(formData.get('usia')), pendidikan: formData.get('pendidikan') as string,
                  pekerjaan: formData.get('pekerjaan') as string, alamat: formData.get('alamat') as string, 
                  kelurahan: formData.get('kelurahan') as string, kecamatan: manualKecamatanPenjamin, 
                  nomor_telepon: formData.get('nomor_telepon') as string,
              };
              
              if (editingPenjamin) {
                  await supabase.from('penjamin').update(dataPenjamin).eq('id_klien', selectedClientId);
                  if (editingKlien) await refreshEditDataOnly(editingKlien.id_klien);
              } else {
                  const {count} = await supabase.from('penjamin').select('*', {count: 'exact', head:true}).eq('id_klien', selectedClientId);
                  if(count && count > 0) await supabase.from('penjamin').update(dataPenjamin).eq('id_klien', selectedClientId);
                  else await supabase.from('penjamin').insert(dataPenjamin);
                  if (editingKlien) await refreshEditDataOnly(editingKlien.id_klien);
              }
              toast({ title: "Berhasil", description: "Data Penjamin Disimpan." });
              setActiveTab("layanan");
          } else if (type === 'layanan') {
              let uploadedFileUrl = null;
              if (fileSuratPermintaan) {
                  setIsUploading(true);
                  const namaKlien = listKlien.find(k => k.id_klien === selectedClientId)?.nama_klien || "klien";
                  uploadedFileUrl = await uploadSuratPermintaan(fileSuratPermintaan, namaKlien);
                  setIsUploading(false);
                  if (!uploadedFileUrl) { setLoading(false); return; }
              }

              const dataLitmas = {
                  id_klien: selectedClientId, id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null, nama_pk: selectedPkId, 
                  nomor_urut: formData.get('nomor_urut') ? Number(formData.get('nomor_urut')) : null, nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
                  tanggal_diterima_bapas: (formData.get('tanggal_diterima_bapas') as string) || null, jenis_litmas: selectedJenisLitmas, 
                  tanggal_registrasi: (formData.get('tanggal_registrasi') as string) || null, nomor_register_litmas: formData.get('nomor_register_litmas') as string,
                  asal_bapas: formData.get('asal_bapas') as string, nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
                  tanggal_surat_permintaan: (formData.get('tanggal_surat_permintaan') as string) || null, nomor_surat_pelimpahan: formData.get('nomor_surat_pelimpahan') as string,
                  tanggal_surat_pelimpahan: (formData.get('tanggal_surat_pelimpahan') as string) || null, waktu_registrasi: new Date().toISOString(),
                  waktu_tunjuk_pk: new Date().toISOString(), 
                  kategori_layanan: layananSubTab, 
                  tahapan_layanan: tahapanLayanan, 
                  ...(uploadedFileUrl ? { file_surat_permintaan_url: uploadedFileUrl } : {})
              };

              let litmasId = editingLitmas?.id_litmas;
              if(editingLitmas) {
                  const { error } = await supabase.from('litmas').update(dataLitmas as any).eq('id_litmas', litmasId);
                  if(error) throw error;
                  
                  if (perkaraList.length > 0) {
                      await supabase.from('perkara').delete().eq('id_litmas', litmasId);
                      const perkaraPayloads = perkaraList.map(p => ({
                          id_litmas: litmasId, pasal: p.pasal, tindak_pidana: p.tindak_pidana, nomor_putusan: p.nomor_putusan,
                          vonis_pidana: p.vonis_pidana, denda: Number(p.denda)||0, subsider_pidana: p.subsider_pidana,
                          tanggal_mulai_ditahan: p.tanggal_mulai_ditahan || null, tanggal_ekspirasi: p.tanggal_ekspirasi || null
                      }));
                      await supabase.from('perkara').insert(perkaraPayloads);
                  }
              } else {
                  const { data, error } = await supabase.from('litmas').insert(dataLitmas as any).select('id_litmas').single();
                  if (error) throw error;
                  litmasId = data.id_litmas;
                  
                  if (perkaraList.length > 0) {
                      const perkaraPayloads = perkaraList.map((p: any) => ({
                          id_litmas: litmasId, pasal: p.pasal, tindak_pidana: p.tindak_pidana, nomor_putusan: p.nomor_putusan,
                          vonis_pidana: p.vonis_pidana, denda: Number(p.denda)||0, subsider_pidana: p.subsider_pidana,
                          tanggal_mulai_ditahan: p.tanggal_mulai_ditahan || null, tanggal_ekspirasi: p.tanggal_ekspirasi || null
                      }));
                      await supabase.from('perkara').insert(perkaraPayloads);
                  }
              }

              const isNewAssignment = !editingLitmas && selectedPkId;
              const isReAssignment = editingLitmas && selectedPkId && selectedPkId !== originalPkId;
              if (isNewAssignment || isReAssignment) {
                    const klienData = listKlien.find(k => k.id_klien === selectedClientId) || editingKlien;
                    const penjaminData = editingPenjamin || {};
                    const perkaraData = perkaraList.length > 0 ? perkaraList[0] : {};
                    const waPayload = {
                        pk_id: selectedPkId, nomor_register_litmas: dataLitmas.nomor_register_litmas, jenis_litmas: dataLitmas.jenis_litmas,
                        asal_surat: dataLitmas.asal_bapas, nama_klien: klienData?.nama_klien || 'Tanpa Nama',
                        jenis_kelamin: klienData?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', agama: klienData?.agama || '-',
                        nama_penjamin: penjaminData.nama_penjamin || '-', alamat_penjamin: penjaminData.alamat || '-',
                        telepon_penjamin: penjaminData.nomor_telepon || '-', pekerjaan_penjamin: penjaminData.pekerjaan || '-',
                        hubungan_penjamin: penjaminData.hubungan_klien ? penjaminData.hubungan_klien.replace('_', ' ').toUpperCase() : '-',
                        perkara: perkaraData.tindak_pidana || '-', pidana: perkaraData.vonis_pidana || '-', 
                        tanggal_2_3: perkaraData.tanggal_ekspirasi || '-', 
                        link_surat_perintah: "https://docs.google.com/document/d/1WHiCF_gwpj5En-l4U_L5MLAuyxGNky8bIsdKF9_3HC0/edit?usp=drivesdk",
                        link_surat_permintaan: uploadedFileUrl || editingLitmas?.file_surat_permintaan_url || '-'
                    };
                    supabase.functions.invoke('send-new-task-notification', { body: waPayload }).then(({ data, error }) => { if (error) console.error("Gagal kirim WA:", error); else console.log("WA Terkirim:", data); });
              }

              setFileSuratPermintaan(null); 
              handleCancelButton(false); 
              toast({ title: "Selesai", description: "Registrasi Layanan Berhasil Disimpan." });
              setActiveTab("list_data");
              fetchTableData();
          }
      } catch (error: any) { toast({ variant: "destructive", title: "Gagal Menyimpan", description: error.message }); } 
      finally { setLoading(false); }
  };

  const initiateSaveKlien = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isCategoryMismatch) return toast({ variant: "destructive", title: "Blokir", description: "Usia tidak sesuai role." });
      const formData = new FormData(e.currentTarget);
      if (!editingKlien && matchesKlien.length > 0) { setDuplicatePayload(formData); setShowDuplicateAlert(true); return; }
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
      setLoading(true);
      const { count } = await supabase.from('penjamin').select('*', { count: 'exact', head: true }).eq('id_klien', selectedClientId);
      setLoading(false);
      let warning = null;
      if (count === 0) warning = "PERHATIAN: Data Penjamin untuk klien ini BELUM DIISI!";
      setConfirmDialog({ isOpen: true, type: 'layanan', payload: formData, warningMessage: warning });
  };

  useEffect(() => { fetchReferences(); }, [fetchReferences]);
  useEffect(() => { if (activeTab === 'list_data') fetchTableData(); }, [activeTab, fetchTableData]);

  // --- RENDER ---
  return (
    <TestPageLayout
      title={`Registrasi (${userRoleCategory})`}
      description="Sistem input data Layanan & Manajemen Klien."
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
      action={
        <Button variant="outline" onClick={() => { setOpenHistory(true); fetchHistory(); }} className="gap-2 bg-white hover:bg-slate-50 text-blue-700 border-blue-200 shadow-sm">
          <History className="w-4 h-4" /> Riwayat Input
        </Button>
      }
    >
      <div className="w-full space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/80 rounded-xl">
            <TabsTrigger value="klien" className="py-3">{editingKlien ? 'Edit Klien' : '1. Data Klien'}</TabsTrigger>
            <TabsTrigger value="penjamin" className="py-3">2. Penjamin</TabsTrigger>
            <TabsTrigger value="layanan" className="py-3">3. Layanan</TabsTrigger>
            <TabsTrigger value="list_data" className="py-3 flex gap-2"><List className="w-4 h-4" /> Data Terdaftar</TabsTrigger>
          </TabsList>

          {/* TAB 1: KLIEN */}
          <TabsContent value="klien">
            <Card className={cn("border-t-4 shadow-sm", editingKlien ? "border-t-amber-500 bg-amber-50/30" : "border-t-slate-800")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Identitas Klien</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setOpenRiwayatKlien(true)} className="text-blue-600 bg-white">
                        <History className="w-4 h-4 mr-2" /> Riwayat Perubahan
                    </Button>
                    {editingKlien && <Button variant="outline" size="sm" onClick={() => handleCancelButton(true)}><XCircle className="w-4 h-4 mr-2" /> Batal</Button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form key={editingKlien ? editingKlien.id_klien : 'klien-new'} onSubmit={initiateSaveKlien} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2" /> Data Diri Utama</h4>
                      
                      <div className="grid gap-2">
                        <Label>Nama Lengkap</Label>
                        <div className="relative">
                          <Input name="nama_klien" defaultValue={editingKlien?.nama_klien || ''} required placeholder="Nama Klien" 
                            onChange={(e) => checkLiveDuplicate('klien', 'nama_klien', e.target.value)} onFocus={() => setActiveInput('nama_klien')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} autoComplete="off"
                            className={cn(matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                          />
                          {matchesKlien.length > 0 && (
                            <TooltipProvider>
                              <Tooltip><TooltipTrigger asChild><div className="absolute right-3 top-2.5 text-orange-500 animate-pulse cursor-help"><AlertCircle className="w-5 h-5" /></div></TooltipTrigger><TooltipContent side="right" className="bg-orange-500 text-white border-0"><p>Data mirip ditemukan!</p></TooltipContent></Tooltip>
                            </TooltipProvider>
                          )}
                          <SuggestionList matches={matchesKlien} isVisible={activeInput === 'nama_klien'} labelField="nama_klien" subLabelField="nik_klien" onSelect={(item) => { handleEditClick(item); setMatchesKlien([]); }} />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3 border rounded-md">
                          <Label className="text-slate-600 text-xs uppercase font-bold">Nama Alias (Julukan)</Label>
                          {namaAlias.map((alias, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                  <Input value={alias} onChange={(e) => handleAliasChange(e.target.value, idx)} placeholder="Contoh: Budi Keren" className="bg-white h-9" />
                                  {idx === namaAlias.length - 1 ? (
                                      <Button type="button" onClick={handleAddAlias} variant="outline" size="icon" className="h-9 w-9 bg-white"><Plus className="w-4 h-4"/></Button>
                                  ) : (
                                      <Button type="button" onClick={() => handleRemoveAlias(idx)} variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                                  )}
                              </div>
                          ))}
                      </div>

                      <div className="grid gap-2">
                        <Label>NIK Klien</Label>
                        <div className="relative">
                          <Input name="nik_klien"required defaultValue={editingKlien?.nik_klien || ''} placeholder="Nomor Induk Kependudukan" 
                            onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; checkLiveDuplicate('klien', 'nik_klien', val); }}
                            onFocus={() => setActiveInput('nik_klien')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric"
                            className={cn(matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                          />
                          {matchesKlien.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                          <SuggestionList matches={matchesKlien} isVisible={activeInput === 'nik_klien'} labelField="nik_klien" subLabelField="nama_klien" onSelect={(item) => { handleEditClick(item); setMatchesKlien([]); }} />
                        </div>
                      </div>

                      <div className="grid gap-2"><Label>No. Register Klien</Label><Input name="nomor_register_klien" defaultValue={editingKlien?.nomor_register_lapas || ''} required placeholder="Menggantikan No. Register Lapas" /></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Jenis Kelamin</Label><Select name="jenis_kelamin" required defaultValue={editingKlien?.jenis_kelamin || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select></div>
                        <div className="grid gap-2">
                          <Label>Agama (ref_agama)</Label>
                          <SearchableSelect options={refAgama} value={selectedAgama} onSelect={setSelectedAgama} labelKey="nama_agama" valueKey="nama_agama" placeholder="Pilih Agama..." searchPlaceholder="Cari agama..." name="agama" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border rounded-md">
                          <div className="grid gap-2">
                              <Label className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-500"/> Kewarganegaraan</Label>
                              <Select value={kewarganegaraan} onValueChange={setKewarganegaraan}>
                                  <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                                  <SelectContent><SelectItem value="WNI">WNI (Indonesia)</SelectItem><SelectItem value="WNA">WNA (Asing)</SelectItem></SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-2">
                              <Label className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500"/> Residivis</Label>
                              <Select value={residivis} onValueChange={setResidivis}>
                                  <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                                  <SelectContent><SelectItem value="Tidak">Tidak</SelectItem><SelectItem value="Ya">Ya</SelectItem></SelectContent>
                              </Select>
                          </div>
                      </div>

                      <div className="grid gap-2">
                          <Label>Pendidikan (ref_pendidikan)</Label>
                          <SearchableSelect options={refPendidikan}required value={selectedPendidikan} onSelect={setSelectedPendidikan} labelKey="tingkat" valueKey="tingkat" placeholder="Pilih Pendidikan..." searchPlaceholder="Cari pendidikan..." name="pendidikan" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Kelahiran & Usia</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={editingKlien?.tempat_lahir || ''} /></div>
                        <div className="grid gap-2"><Label>Tanggal Lahir</Label><Input name="tanggal_lahir" type="date" value={tglLahir} onChange={handleDateChange} required /></div>
                      </div>
                      
                      {usiaWarning && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Akses Ditolak</AlertTitle><AlertDescription>{usiaWarning}</AlertDescription></Alert>}

                      <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md">
                        <div className="grid gap-1"><Label className="text-xs text-slate-500">Usia</Label><Input name="usia" value={hitungUsia} readOnly className="bg-white" /></div>
                        <div className="grid gap-1"><Label className="text-xs text-slate-500">Kategori</Label><Input name="kategori_usia" value={isOpAnak ? 'Anak' : (isOpDewasa ? 'Dewasa' : hitungKategori)} readOnly className="bg-white font-bold" /></div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Status Perkawinan</Label>
                        <Select value={statusPerkawinan} onValueChange={setStatusPerkawinan}>
                            <SelectTrigger><SelectValue placeholder="Pilih Status..." /></SelectTrigger>
                            <SelectContent><SelectItem value="Belum Kawin">Belum Kawin</SelectItem><SelectItem value="Kawin">Kawin</SelectItem><SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem><SelectItem value="Cerai Mati">Cerai Mati</SelectItem></SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                          <Label>Pekerjaan (ref_pekerjaan)</Label>
                          <SearchableSelect options={refPekerjaan} value={selectedPekerjaan} onSelect={setSelectedPekerjaan} labelKey="nama_pekerjaan" valueKey="nama_pekerjaan"required placeholder="Pilih Pekerjaan..." searchPlaceholder="Cari pekerjaan..." name="pekerjaan" />
                      </div>
                      <div className="grid gap-2"><Label>Minat / Bakat</Label><Input name="minat_bakat" defaultValue={editingKlien?.minat_bakat || ''} /></div>
                    </div>
                  </div>

                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Alamat Lengkap</Label><Textarea name="alamat"required defaultValue={editingKlien?.alamat || ''} className="h-24" /></div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                           <Label>Kelurahan (ref_kelurahan)</Label>
                           <SearchableSelect 
                              options={refKelurahan} 
                              required value={selectedKelurahan} 
                              onSelect={handleSelectKelurahan} 
                              labelKey="nama_kelurahan" 
                              valueKey="nama_kelurahan" 
                              placeholder="Pilih Kelurahan..." 
                              searchPlaceholder="Cari kelurahan..." 
                              name="kelurahan" 
                           />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kecamatan (Otomatis)</Label>
                            <Input name="kecamatan" required value={manualKecamatan} readOnly className="bg-slate-100 font-medium text-slate-700" placeholder="Pilih kelurahan dulu..." />
                        </div>
                      </div>
                      <div className="grid gap-2">
                          <Label>Nomor Telepon</Label>
                          <Input name="nomor_telepon" required defaultValue={editingKlien?.nomor_telepon || ''} onChange={handlePhoneValidation} placeholder="Contoh: 08123456789" />
                      </div>
                    </div>
                  </div>
                  
                  {/* --- READ-ONLY: PERKARA & RIWAYAT LAYANAN --- */}
                  {editingKlien && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      
                      <div className="p-4 bg-slate-50 border rounded-lg">
                          <h4 className="font-bold flex items-center gap-2 mb-3 text-slate-700"><Gavel className="w-4 h-4"/> Informasi Perkara</h4>
                          <p className="text-xs text-slate-500 mb-4 italic">Pembaruan data perkara melalui Tab Layanan.</p>
                          {perkaraList.length > 0 ? (
                              <div className="space-y-2">
                                  {perkaraList.map((p, i) => (
                                      <div key={i} className="text-sm bg-white p-3 border rounded shadow-sm flex items-center gap-4">
                                          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">{p.pasal}</Badge> 
                                          <span className="font-medium text-slate-800">{p.tindak_pidana}</span>
                                          <span className="text-slate-500 ml-auto">Vonis: <strong className="text-slate-800">{p.vonis_pidana}</strong></span>
                                      </div>
                                  ))}
                              </div>
                          ) : <p className="text-sm italic text-slate-400">Belum ada data perkara.</p>}
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                          <h4 className="font-bold flex items-center gap-2 mb-3 text-blue-800"><Activity className="w-4 h-4"/> Riwayat Layanan Klien</h4>
                          <p className="text-xs text-blue-500 mb-4 italic">Daftar layanan yang pernah dijalani.</p>
                          {editingKlien.litmas && editingKlien.litmas.length > 0 ? (
                              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                  {editingKlien.litmas.map((l: any, i: number) => (
                                      <div key={i} className="text-sm bg-white p-3 border rounded shadow-sm relative overflow-hidden">
                                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                          <div className="flex justify-between items-center mb-2">
                                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">{l.kategori_layanan || 'Litmas'}</Badge>
                                              <span className="text-[10px] text-slate-500">{l.tanggal_registrasi}</span>
                                          </div>
                                          <div className="font-medium text-slate-800 text-xs mb-1">{l.jenis_litmas}</div>
                                          <div className="text-[10px] text-slate-500 bg-slate-50 border px-2 py-1 rounded inline-block">
                                            Tahap: <span className="font-semibold text-slate-700">{l.tahapan_layanan || '-'}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : <p className="text-sm italic text-slate-400">Belum ada riwayat layanan.</p>}
                      </div>

                    </div>
                  )}

                  <div className="flex justify-end pt-4 gap-2">
                    <Button type="submit" size="lg" className={cn("w-full md:w-auto", editingKlien ? "bg-amber-600 hover:bg-amber-700" : "")} disabled={loading || isCategoryMismatch}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingKlien ? "Simpan Perubahan Klien" : "Simpan & Lanjut ke Penjamin")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PENJAMIN */}
          <TabsContent value="penjamin">
            <Card className="border-t-4 border-t-green-600 shadow-sm">
              <CardHeader><CardTitle>Data Penjamin</CardTitle><CardDescription>Informasi keluarga.</CardDescription></CardHeader>
              <CardContent>
                <form key={editingPenjamin ? `penjamin-${editingPenjamin.id_klien}` : 'penjamin-new'} onSubmit={initiateSavePenjamin} className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector listKlien={listKlien} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} editingKlien={editingKlien} handleCancelButton={handleCancelButton} loading={loading} userRoleCategory={userRoleCategory} /></div>
                  <div className={cn("space-y-6", !selectedClientId && "opacity-50 pointer-events-none")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label>Nama Penjamin</Label>
                        <div className="relative">
                          <Input name="nama_penjamin" defaultValue={editingPenjamin?.nama_penjamin || ''} required onChange={(e) => checkLiveDuplicate('penjamin', 'nama_penjamin', e.target.value)} onFocus={() => setActiveInput('nama_penjamin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} autoComplete="off" className={cn(matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                          {matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                          <SuggestionList matches={matchesPenjamin} isVisible={activeInput === 'nama_penjamin'} labelField="nama_penjamin" subLabelField="nik_penjamin" onSelect={(item) => { toast({ title: "Info", description: `Penjamin ${item.nama_penjamin} sudah ada.` }); setMatchesPenjamin([]); }} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>NIK Penjamin</Label>
                        <div className="relative">
                          <Input name="nik_penjamin" defaultValue={editingPenjamin?.nik_penjamin || ''} placeholder="Wajib Diisi" required onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; checkLiveDuplicate('penjamin', 'nik_penjamin', val); }} onFocus={() => setActiveInput('nik_penjamin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric" className={cn(matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                          {matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                          <SuggestionList matches={matchesPenjamin} isVisible={activeInput === 'nik_penjamin'} labelField="nik_penjamin" subLabelField="nama_penjamin" onSelect={(item) => { toast({ title: "Info", description: `NIK ${item.nik_penjamin} sudah terdaftar.` }); setMatchesPenjamin([]); }} />
                        </div>
                      </div>
                      <div className="grid gap-2">
                          <Label>Hubungan (ref_hubungan)</Label>
                          <SearchableSelect options={refHubungan}required value={selectedHubungan} onSelect={setSelectedHubungan} labelKey="nama_hubungan" valueKey="nama_hubungan" placeholder="Pilih Hubungan..." searchPlaceholder="Cari hubungan..." name="hubungan_klien" />
                      </div>
                      <div className="grid gap-2">
                          <Label>Agama (ref_agama)</Label>
                          <SearchableSelect options={refAgama} required value={selectedAgamaPenjamin} onSelect={setSelectedAgamaPenjamin} labelKey="nama_agama" valueKey="nama_agama" placeholder="Pilih Agama..." searchPlaceholder="Cari agama..." name="agama" />
                      </div>
                      <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" required defaultValue={editingPenjamin?.tempat_lahir || ''} /></div>
                      
                      <div className="grid gap-2">
                          <Label>Tanggal Lahir</Label>
                          <Input name="tanggal_lahir" type="date" value={penjaminTglLahir}required onChange={handlePenjaminDateChange} />
                      </div>
                      <div className="grid gap-2">
                          <Label>Usia</Label>
                          <Input name="usia" type="number" className="w-24 bg-slate-100" value={penjaminUsia} readOnly placeholder="Auto" />
                      </div>

                      <div className="grid gap-2">
                          <Label>Pendidikan (ref_pendidikan)</Label>
                          <SearchableSelect options={refPendidikan}required value={selectedPendidikanPenjamin} onSelect={setSelectedPendidikanPenjamin} labelKey="tingkat" valueKey="tingkat" placeholder="Pilih Pendidikan..." searchPlaceholder="Cari pendidikan..." name="pendidikan" />
                      </div>
                      <div className="grid gap-2">
                          <Label>Pekerjaan (ref_pekerjaan)</Label>
                          <SearchableSelect options={refPekerjaan}required value={selectedPekerjaanPenjamin} onSelect={setSelectedPekerjaanPenjamin} labelKey="nama_pekerjaan" valueKey="nama_pekerjaan" placeholder="Pilih Pekerjaan..." searchPlaceholder="Cari pekerjaan..." name="pekerjaan" />
                      </div>
                      <div className="grid gap-2"><Label>No. Telepon</Label><Input name="nomor_telepon" type="tel" defaultValue={editingPenjamin?.nomor_telepon || ''}required onChange={handlePhoneValidation} placeholder="Contoh: 08123456789" /></div>
                      <div className="grid gap-2 col-span-2"><Label>Alamat</Label><Textarea name="alamat"required defaultValue={editingPenjamin?.alamat || ''} /></div>
                      
                      <div className="grid gap-2">
                          <Label>Kelurahan (ref_kelurahan)</Label>
                          <SearchableSelect options={refKelurahan}required value={selectedKelurahanPenjamin} onSelect={handleSelectKelurahanPenjamin} labelKey="nama_kelurahan" valueKey="nama_kelurahan" placeholder="Pilih Kelurahan..." searchPlaceholder="Cari kelurahan..." name="kelurahan" />
                      </div>
                      <div className="grid gap-2">
                          <Label>Kecamatan (Otomatis)</Label>
                          <Input name="kecamatan"required value={manualKecamatanPenjamin} readOnly className="bg-slate-100 font-medium text-slate-700" placeholder="Pilih kelurahan dulu..." />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" className="bg-green-600 hover:bg-green-700">{loading ? <Loader2 className="animate-spin"/> : "Simpan Penjamin"}</Button></div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: LAYANAN */}
          <TabsContent value="layanan">
            <Card className="border-t-4 border-t-blue-600 shadow-sm">
              <CardHeader><CardTitle>Registrasi Layanan & Dokumen</CardTitle><CardDescription>Pilih layanan, upload surat permintaan, dan input perkara.</CardDescription></CardHeader>
              <CardContent>
                <form key={editingLitmas ? editingLitmas.id_litmas : 'litmas-new'} onSubmit={initiateSaveLayanan} className="space-y-6">
                  
                  <Tabs value={layananSubTab} onValueChange={setLayananSubTab} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-4 bg-blue-50/50 p-1 rounded-xl">
                      <TabsTrigger value="litmas" className="py-2">Litmas</TabsTrigger>
                      <TabsTrigger value="pendampingan" className="py-2">Pendampingan</TabsTrigger>
                      <TabsTrigger value="pengawasan" className="py-2">Pengawasan</TabsTrigger>
                      <TabsTrigger value="pembimbingan" className="py-2">Pembimbingan</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector listKlien={listKlien} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} editingKlien={editingKlien} handleCancelButton={handleCancelButton} loading={loading} userRoleCategory={userRoleCategory} /></div>
                  <div className={cn("space-y-6", !selectedClientId && "opacity-50 pointer-events-none")}>
                    
                    <div className="grid gap-2 p-4 bg-blue-50/30 border border-blue-100 rounded-xl mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold text-blue-900">Tahapan {layananSubTab.charAt(0).toUpperCase() + layananSubTab.slice(1)} <span className="text-red-500">*</span></Label>
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
                          <Label className="font-semibold text-blue-900">Jenis Layanan Tertentu <span className="text-red-500">*</span></Label>
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

                    {/* UPLOAD SURAT PERMINTAAN */}
                    <div className="space-y-4">
                        <Label className="font-bold text-blue-800">Upload Surat Permintaan (Sesuai Layanan)</Label>
                        <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-blue-300 px-6 py-6 hover:bg-blue-50 hover:border-blue-400 transition-all relative cursor-pointer group">
                          <div className="text-center w-full">
                            {fileSuratPermintaan ? (
                              <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in-95">
                                <FileText className="mx-auto h-12 w-12" />
                                <span className="mt-2 block text-sm font-semibold">{fileSuratPermintaan.name}</span>
                                <span className="text-xs text-slate-500 bg-green-50 px-2 py-1 rounded-full mt-1">Siap diupload (Klik Simpan)</span>
                              </div>
                            ) 
                            : (editingLitmas && editingLitmas.file_surat_permintaan_url) ? (
                              <div className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-50/50 border border-blue-100">
                                  <FileText className="h-10 w-10 text-blue-600 mb-2" />
                                  <span className="text-sm font-bold text-slate-700">Surat Permintaan Tersimpan</span>
                                  <div className="flex gap-2 mt-2 z-20 relative">
                                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={(e) => { e.preventDefault(); window.open(editingLitmas.file_surat_permintaan_url, '_blank'); }}>
                                          <ExternalLink className="w-3 h-3 mr-1"/> Lihat File
                                      </Button>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-2 italic">Klik area ini untuk mengganti file</span>
                              </div>
                            ) 
                            : (
                              <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                <CloudUpload className="mx-auto h-12 w-12 mb-2" />
                                <span className="block text-sm font-semibold">Pilih File Surat Permintaan</span>
                                <span className="text-xs mt-1">PDF, JPG, PNG (Maks 5MB)</span>
                              </div>
                            )}
                          </div>
                          <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.jpg,.jpeg,.png"required onChange={(e) => { if (e.target.files && e.target.files[0]) { setFileSuratPermintaan(e.target.files[0]); toast({ title: "File Dipilih", description: e.target.files[0].name }); } }} />
                        </div>
                    </div>

                    {/* --- RENDER FORM BERDASARKAN SUB-TAB LAYANAN --- */}
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

                                        <Separator />

                    {/* INPUT DATA PERKARA */}
                    <div className="space-y-4 bg-red-50 p-6 rounded-lg border border-red-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2"><Gavel className="w-5 h-5" />Input Data Perkara</h3>
                        <Badge variant="outline" className="bg-white text-red-600 border-red-200">Total: {perkaraList.length} Kasus</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded shadow-sm">
                        <div className="md:col-span-2 grid gap-2"><Label>Pasal</Label><Input value={tempPerkara.pasal} onChange={(e) => setTempPerkara({...tempPerkara, pasal: e.target.value})} placeholder="Cth: 363" /></div>
                        <div className="md:col-span-3 grid gap-2"><Label>Tindak Pidana</Label><Input value={tempPerkara.tindak_pidana} onChange={(e) => setTempPerkara({...tempPerkara, tindak_pidana: e.target.value})} placeholder="Pencurian" /></div>
                        <div className="md:col-span-3 grid gap-2"><Label>No. Putusan</Label><Input value={tempPerkara.nomor_putusan} onChange={(e) => setTempPerkara({...tempPerkara, nomor_putusan: e.target.value})} /></div>
                        <div className="md:col-span-4 grid gap-2"><Label>Vonis Pidana</Label><DurationInput label="Durasi Vonis" value={tempPerkara.vonis_pidana} onChange={(val) => setTempPerkara({...tempPerkara, vonis_pidana: val})} /></div>
                        
                        <div className="md:col-span-3 grid gap-2"><Label>Denda (Rp)</Label><Input type="number" value={tempPerkara.denda} onChange={(e) => setTempPerkara({...tempPerkara, denda: e.target.value})} /></div>
                        <div className="md:col-span-4 grid gap-2"><Label>Subsider</Label><DurationInput label="Durasi Subsider" value={tempPerkara.subsider_pidana} onChange={(val) => setTempPerkara({...tempPerkara, subsider_pidana: val})} /></div>
                        <div className="md:col-span-2 grid gap-2"><Label>Mulai Ditahan</Label><Input type="date" value={tempPerkara.tanggal_mulai_ditahan} onChange={(e) => setTempPerkara({...tempPerkara, tanggal_mulai_ditahan: e.target.value})} /></div>
                        <div className="md:col-span-2 grid gap-2"><Label>Ekspirasi</Label><Input type="date" value={tempPerkara.tanggal_ekspirasi} onChange={(e) => setTempPerkara({...tempPerkara, tanggal_ekspirasi: e.target.value})} /></div>
                        
                        <div className="md:col-span-1">
                          <Button type="button" onClick={() => { if (!tempPerkara.pasal || !tempPerkara.tindak_pidana) return toast({ variant: "destructive", title: "Gagal", description: "Pasal & Tindak Pidana wajib diisi." }); setPerkaraList([...perkaraList, { ...tempPerkara, id: Date.now() }]); setTempPerkara({ pasal: '', tindak_pidana: '', nomor_putusan: '', vonis_pidana: '', denda: '', subsider_pidana: '', tanggal_mulai_ditahan: '', tanggal_ekspirasi: '' }); }} size="icon" className="bg-red-600 hover:bg-red-700 w-full"><Plus className="w-5 h-5" /></Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {perkaraList.map((p, idx) => (
                          <div key={p.id || idx} className="flex items-center justify-between bg-white p-3 rounded border border-red-200 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                              <div><span className="text-xs text-slate-500 block">Pasal</span><span className="font-bold">{p.pasal}</span></div>
                              <div><span className="text-xs text-slate-500 block">Pidana</span><span>{p.tindak_pidana}</span></div>
                              <div><span className="text-xs text-slate-500 block">Vonis</span><span>{p.vonis_pidana}</span></div>
                              <div><span className="text-xs text-slate-500 block">Ekspirasi</span><span className="text-red-600 font-medium">{p.tanggal_ekspirasi}</span></div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { const newList = [...perkaraList]; newList.splice(idx, 1); setPerkaraList(newList); }} className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                        {perkaraList.length === 0 && <p className="text-center text-sm text-red-400 italic">Belum ada data perkara ditambahkan.</p>}
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-blue-900 font-bold flex items-center gap-2"><UserCheck className="w-4 h-4" /> Tunjuk Petugas PK</Label>
                        <Popover open={openPkCombo} onOpenChange={setOpenPkCombo}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openPkCombo} className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 h-auto py-2 text-left">
                              {listPK.find((pk) => pk.id === selectedPkId) ? (
                                <div className="flex flex-col items-start text-left leading-tight overflow-hidden"><span className="font-semibold text-slate-900 truncate w-full">{listPK.find((pk) => pk.id === selectedPkId)?.nama}</span><span className="text-xs text-slate-500 truncate w-full">NIP: {listPK.find((pk) => pk.id === selectedPkId)?.nip}</span></div>
                              ) : <span className="text-slate-500">Pilih Petugas PK...</span>}
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
                                    <CommandItem key={pk.id} value={`${pk.nama} ${pk.nip}`} onSelect={() => { setSelectedPkId(pk.id); setOpenPkCombo(false); }}>
                                      <Check className={cn("mr-2 h-4 w-4", selectedPkId === pk.id ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col"><span className="font-medium">{pk.nama}</span><span className="text-xs text-muted-foreground">NIP: {pk.nip}</span></div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload...</> : <>{loading ? <Loader2 className="animate-spin"/> : "Simpan Layanan & Dokumen"}</>}</Button></div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: LIST DATA */}
          <TabsContent value="list_data">
            <Tabs defaultValue="list_klien" className="w-full">
              <div className="flex items-center justify-between mb-4"><TabsList><TabsTrigger value="list_klien">Data Klien</TabsTrigger><TabsTrigger value="list_litmas">Layanan Terdaftar</TabsTrigger></TabsList><Button variant="ghost" size="sm" onClick={fetchTableData}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button></div>
              <TabsContent value="list_klien">
                <Card className="border-t-4 border-t-purple-600 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div><CardTitle>Daftar Klien Terdaftar</CardTitle><CardDescription>Database klien {userRoleCategory}</CardDescription></div>
                      <div className="flex gap-2">
                        <div className="relative w-60">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                          <Input placeholder="Cari Nama Klien..." className="pl-8" value={searchKlienQuery} onChange={(e) => setSearchKlienQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchKlien()} />
                        </div>
                        <Button size="icon" variant="outline" onClick={handleSearchKlien}><Search className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Klien</TableHead>
                          <TableHead>No. Register</TableHead>
                          <TableHead>JK</TableHead>
                          <TableHead>Usia</TableHead>
                          <TableHead>No. Telepon</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataKlienFull.length > 0 ? dataKlienFull.map((k) => (
                          <TableRow key={k.id_klien}>
                            <TableCell className="font-medium">{k.nama_klien}</TableCell>
                            <TableCell>{k.nomor_register_lapas}</TableCell>
                            <TableCell>{k.jenis_kelamin}</TableCell>
                            <TableCell>{k.usia} Thn</TableCell>
                            <TableCell>{k.nomor_telepon || '-'}</TableCell>
                            <TableCell className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => { setDetailData(k); setOpenDetail(true); }}><Eye className="w-3.5 h-3.5 mr-1" /> Detail</Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(k)} className="h-8 px-2 text-blue-600"><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                            </TableCell>
                          </TableRow>
                        )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="list_litmas">
                <Card className="border-t-4 border-t-orange-600 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div><CardTitle>Daftar Layanan Terdaftar</CardTitle><CardDescription>Status registrasi.</CardDescription></div>
                      <div className="flex gap-2"><div className="relative w-60"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Cari No. Surat..." className="pl-8" value={searchLitmasQuery} onChange={(e) => setSearchLitmasQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLitmas()} /></div><Button size="icon" variant="outline" onClick={handleSearchLitmas}><Search className="w-4 h-4"/></Button></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Surat</TableHead>
                          <TableHead>Kategori & Status</TableHead>
                          <TableHead>Klien</TableHead>
                          <TableHead>Petugas PK</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataLitmas.length > 0 ? dataLitmas.map((l) => (
                          <TableRow key={l.id_litmas}>
                            <TableCell className="font-medium">
                                {l.nomor_surat_permintaan}
                                <div className="text-[10px] text-slate-400 mt-1">
                                    Tgl: {l.tanggal_surat_permintaan}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                    <Badge variant="outline" className="text-xs bg-slate-50">{l.kategori_layanan ? l.kategori_layanan.toUpperCase() : 'LITMAS'}</Badge>
                                    <Badge className={
                                        l.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' :
                                        l.status === 'Selesai' ? 'bg-blue-600 hover:bg-blue-700' :
                                        l.status === 'On Progress' ? 'bg-blue-500 hover:bg-blue-600' :
                                        l.status === 'Review' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                        'bg-slate-500 hover:bg-slate-600'
                                    }>
                                        {l.status || 'New Task'}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>{l.klien?.nama_klien}</TableCell>
                            <TableCell>
                                {l.petugas_pk ? 
                                    <span className="text-blue-700 font-medium flex items-center gap-1">
                                        <UserCheck className="w-3 h-3"/> {l.petugas_pk.nama}
                                    </span> : 
                                    <span className="text-red-500 text-xs italic">Belum Ada PK</span>
                                }
                            </TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => { setSelectedLitmasDetail(l); setOpenLitmasDetail(true); }}
                                >
                                    <Eye className="w-4 h-4 text-slate-500 hover:text-blue-600"/>
                                </Button>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- MODAL: RIWAYAT PERUBAHAN DATA KLIEN --- */}
      <Dialog open={openRiwayatKlien} onOpenChange={setOpenRiwayatKlien}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="w-5 h-5 text-blue-600"/> Riwayat Perubahan Data</DialogTitle>
            <DialogDescription className="sr-only">Daftar perubahan data klien.</DialogDescription>
            <DialogDescription>Daftar perubahan untuk Pekerjaan, Perkawinan, Agama, Pendidikan, Alamat, dan Telepon.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] border rounded-md p-4 bg-slate-50/50 mt-2">
            <div className="space-y-6">
                <div className="border-l-2 border-blue-500 pl-4 relative">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                    <p className="text-xs text-slate-500 mb-1">Hari ini - {format(new Date(), "dd MMM yyyy")}</p>
                    <p className="text-sm font-semibold text-slate-800">Status Perkawinan diperbarui</p>
                    <div className="mt-2 text-xs bg-white p-2 border rounded text-slate-600">
                        <span className="line-through text-red-400 mr-2">Belum Kawin</span> &rarr; <span className="font-bold text-green-600 ml-2">Kawin</span>
                    </div>
                </div>
                
                <div className="border-l-2 border-blue-500 pl-4 relative">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                    <p className="text-xs text-slate-500 mb-1">2 Hari yang lalu</p>
                    <p className="text-sm font-semibold text-slate-800">Pekerjaan diperbarui</p>
                    <div className="mt-2 text-xs bg-white p-2 border rounded text-slate-600">
                        <span className="line-through text-red-400 mr-2">Wiraswasta</span> &rarr; <span className="font-bold text-green-600 ml-2">Karyawan Swasta</span>
                    </div>
                </div>

                <div className="border-l-2 border-blue-500 pl-4 relative">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                    <p className="text-xs text-slate-500 mb-1">Minggu lalu</p>
                    <p className="text-sm font-semibold text-slate-800">Nomor Telepon diperbarui</p>
                    <div className="mt-2 text-xs bg-white p-2 border rounded text-slate-600">
                        <span className="line-through text-red-400 mr-2">081234567890</span> &rarr; <span className="font-bold text-green-600 ml-2">089999999999</span>
                    </div>
                </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* SIDE SHEET: RIWAYAT INPUT UMUM */}
      <Sheet open={openHistory} onOpenChange={setOpenHistory}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col h-full">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> Riwayat Input Data Baru</SheetTitle>
            <SheetDescription>Aktivitas penambahan data 7 hari terakhir.</SheetDescription>
          </SheetHeader>
          <div className="flex justify-end py-2"><Button variant="ghost" size="sm" onClick={fetchHistory} disabled={loadingHistory} className="text-xs h-8 gap-2 hover:bg-slate-100"><RefreshCw className={cn("w-3.5 h-3.5", loadingHistory && "animate-spin")} /> Refresh Data</Button></div>
          <ScrollArea className="flex-1 -mx-6 px-6">
              {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs">Memuat data...</span></div>
              ) : historyData.length > 0 ? (
                  <div className="space-y-4 py-2 pb-10">
                      {historyData.map((item, idx) => (
                          <div key={idx} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0 group">
                              <div className={cn("w-2 h-2 mt-2 rounded-full shrink-0 ring-2 ring-offset-2", item.type === 'Klien Baru' ? "bg-purple-500 ring-purple-100" : item.type === 'Penjamin' ? "bg-green-500 ring-green-100" : "bg-blue-500 ring-blue-100")}></div>
                              <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer">{item.title}</p>
                                  <div className="flex items-center gap-2 mt-1.5"><Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal border bg-slate-50">{item.type}</Badge><span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(item.date), "dd MMM HH:mm", { locale: localeId })}</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (<div className="text-center py-20 opacity-50"><History className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-sm">Belum ada aktivitas baru.</p></div>)}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* FLOATING BUTTON MOBILE */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700" onClick={() => { setOpenHistory(true); fetchHistory(); }}><History className="w-6 h-6" /></Button></TooltipTrigger><TooltipContent side="left" className="bg-blue-600 text-white"><p>Lihat Riwayat Input</p></TooltipContent></Tooltip></TooltipProvider>
      </div>

      {/* ALERT DUPLICATE CHECK */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent className="border-l-4 border-l-orange-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600"><AlertTriangle className="w-5 h-5" /> Data Mirip Terdeteksi!</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">Sistem mendeteksi bahwa nama atau NIK yang Anda masukkan sudah ada di database.<br/>Apakah Anda yakin ingin <strong>menyimpan data ganda</strong> ini?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDuplicateAlert(false); setDuplicatePayload(null); }}>Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDuplicateAlert(false); setConfirmDialog({ isOpen: true, type: 'klien', payload: duplicatePayload }); }} className="bg-orange-600 hover:bg-orange-700">Ya, Tetap Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRMATION DIALOG */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent className={cn("border-l-4", confirmDialog.warningMessage ? "border-l-red-600" : "border-l-blue-600")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn("flex items-center gap-2", confirmDialog.warningMessage ? "text-red-700" : "text-blue-700")}>{confirmDialog.warningMessage ? <ShieldAlert className="w-6 h-6" /> : <Save className="w-5 h-5" />}{confirmDialog.warningMessage ? "Peringatan Validasi Data!" : "Konfirmasi Penyimpanan"}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-700 text-base">{confirmDialog.warningMessage ? <span className="block bg-red-50 p-3 rounded-md border border-red-100 text-red-800 font-medium mt-2">{confirmDialog.warningMessage}</span> : "Apakah seluruh data yang Anda masukkan sudah benar?"}<br/><span className="block mt-2">Data akan disimpan ke dalam sistem MONALISA.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel><AlertDialogAction onClick={executeSave} disabled={loading} className={cn(confirmDialog.warningMessage ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{confirmDialog.warningMessage ? "Tetap Lanjutkan" : "Ya, Simpan Data"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- MODIFIED DETAIL DIALOG (KLIEN) --- */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 bg-slate-50 border-b shrink-0">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">{detailData?.nama_klien?.charAt(0) || <User />}</div><div><DialogTitle className="text-xl font-bold flex items-center gap-2">{detailData?.nama_klien}</DialogTitle><DialogDescription className="sr-only">Detail data klien terdaftar.</DialogDescription><div className="flex gap-2 mt-1"><Badge variant="outline" className="bg-white border-slate-300 text-slate-600 font-normal">Reg: {detailData?.nomor_register_lapas}</Badge><Badge className={cn("text-xs font-normal", detailData?.kategori_usia === "Anak" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800")}>{detailData?.kategori_usia}</Badge></div></div></div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6 bg-slate-50/30">
            {detailData ? (
              <div className="space-y-8 pb-10">
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4"/> Informasi Pribadi</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border shadow-sm"><div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">NIK</span><span className="col-span-2 font-semibold text-slate-800">{detailData.nik_klien || '-'}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">TTL</span><span className="col-span-2 text-slate-800">{detailData.tempat_lahir}, {detailData.tanggal_lahir}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">JK</span><span className="col-span-2 text-slate-800">{detailData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div></div><div className="space-y-4"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">Pendidikan</span><span className="col-span-2 text-slate-800 flex items-center gap-1"><GraduationCap className="w-3 h-3 text-slate-400"/> {detailData.pendidikan}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500 font-medium">Pekerjaan</span><span className="col-span-2 text-slate-800 flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400"/> {detailData.pekerjaan || '-'}</span></div></div></div></section>
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-4 h-4"/> Alamat & Kontak</h3><div className="bg-white p-5 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><p className="text-xs text-slate-400 uppercase font-semibold">Alamat Lengkap</p><p className="text-sm text-slate-700 leading-relaxed">{detailData.alamat}</p><div className="flex gap-4 mt-2 text-sm text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded">Kel: {detailData.kelurahan || '-'}</span><span className="bg-slate-100 px-2 py-1 rounded">Kec: {detailData.kecamatan || '-'}</span></div></div><div className="space-y-2"><p className="text-xs text-slate-400 uppercase font-semibold">Nomor Telepon</p><p className="text-lg font-bold text-green-700 flex items-center gap-2"><Phone className="w-4 h-4"/> {detailData.nomor_telepon || '-'}</p></div></div></section>
                <section><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4"/> Data Penjamin</h3>{detailData.penjamin && detailData.penjamin.length > 0 ? ( detailData.penjamin.map((p: any, idx: number) => (<div key={idx} className="bg-green-50/50 p-5 rounded-xl border border-green-100 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 bg-green-100 px-3 py-1 text-xs font-bold text-green-700 rounded-bl-lg">{p.hubungan_klien?.replace('_', ' ').toUpperCase()}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-3"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Nama</span><span className="col-span-2 font-bold text-slate-800">{p.nama_penjamin}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">NIK</span><span className="col-span-2 font-mono text-slate-700">{p.nik_penjamin || '-'}</span></div></div><div className="space-y-3"><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Kontak</span><span className="col-span-2 font-bold text-green-700">{p.nomor_telepon || '-'}</span></div><div className="grid grid-cols-3 gap-2 text-sm"><span className="text-slate-500">Alamat</span><span className="col-span-2 text-slate-700 text-xs leading-relaxed">{p.alamat}</span></div></div></div></div>))) : (<div className="p-4 bg-slate-100 rounded-lg text-center text-slate-500 text-sm italic">Belum ada data penjamin.</div>)}</section>
                
                {/* --- NEW: RIWAYAT LAYANAN --- */}
                <section>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Riwayat Layanan Klien</h3>
                  {detailData.litmas && detailData.litmas.length > 0 ? (
                      <div className="space-y-4">
                          {detailData.litmas.map((l: any, lIdx: number) => (
                              <div key={lIdx} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                  <div className="bg-slate-50 p-3 px-4 border-b flex justify-between items-center">
                                      <div className="flex items-center gap-3">
                                          <Badge className="bg-blue-600 uppercase text-[10px] tracking-wide">{l.kategori_layanan || 'Litmas'}</Badge>
                                          <span className="text-xs font-mono text-slate-500 bg-white border px-1.5 py-0.5 rounded">{l.nomor_surat_permintaan}</span>
                                          <span className="text-xs text-slate-500 bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Tahap: {l.tahapan_layanan || '-'}</span>
                                      </div>
                                      <div className="text-xs text-slate-500">PK: <span className="font-bold text-blue-700">{l.petugas_pk?.nama || 'Belum Ada'}</span></div>
                                  </div>
                                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-b">
                                      <div><span className="block text-slate-400 font-semibold mb-1">Asal UPT</span><span className="font-medium text-slate-700">{l.ref_upt?.nama_upt || '-'}</span></div>
                                      <div><span className="block text-slate-400 font-semibold mb-1">Tgl Surat</span><span className="font-medium text-slate-700">{l.tanggal_surat_permintaan}</span></div>
                                      <div className="col-span-2"><span className="block text-slate-400 font-semibold mb-1">Jenis Layanan Tertentu</span><span className="font-medium text-slate-700">{l.jenis_litmas}</span></div>
                                  </div>
                                  {l.perkara && l.perkara.length > 0 && (
                                      <div className="p-4 bg-slate-50/50">
                                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Data Perkara Saat Laporan</p>
                                          <div className="space-y-2">
                                              {l.perkara.map((p: any, pIdx: number) => (
                                                  <div key={pIdx} className="bg-white border rounded-lg p-3 text-xs grid grid-cols-1 md:grid-cols-4 gap-3 relative overflow-hidden">
                                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                                      <div><span className="block text-slate-400">Pasal</span><span className="font-bold text-slate-800">{p.pasal}</span></div>
                                                      <div className="col-span-2"><span className="block text-slate-400">Pidana</span><span className="block font-medium text-slate-800">{p.tindak_pidana}</span></div>
                                                      <div><span className="block text-slate-400">Vonis</span><span className="block font-medium text-slate-800">{p.vonis_pidana}</span></div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="p-8 border-2 border-dashed rounded-xl text-center">
                          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                          <p className="text-slate-500 text-sm">Belum ada riwayat layanan.</p>
                      </div>
                  )}
                </section>
              </div>
            ) : (<div className="flex flex-col items-center justify-center h-64 text-slate-400"><Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" /><p>Memuat data...</p></div>)}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG MONITORING LAYANAN --- */}
      <Dialog open={openLitmasDetail} onOpenChange={setOpenLitmasDetail}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
                <div className="flex items-center justify-between mr-8">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600"/> Monitoring Progress Layanan
                    </DialogTitle>
                    <DialogDescription className="sr-only">Lacak progres layanan.</DialogDescription>
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
                        {selectedLitmasDetail?.status || 'New Task'}
                    </Badge>
                </div>
                <DialogDescription>
                    Nomor Surat: <span className="font-mono text-slate-700 font-bold">{selectedLitmasDetail?.nomor_surat_permintaan}</span>
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
                
                {/* INFO GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-100">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Klien</span> 
                        <p className="font-semibold text-slate-800">{selectedLitmasDetail?.klien?.nama_klien}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Layanan</span> 
                        <p className="font-medium text-slate-700">{selectedLitmasDetail?.kategori_layanan?.toUpperCase() || 'LITMAS'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asal UPT</span> 
                        <p className="font-medium text-slate-700">{selectedLitmasDetail?.asal_bapas || '-'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PK Penanggungjawab</span> 
                        <p className="font-medium text-blue-700">{selectedLitmasDetail?.petugas_pk?.nama || 'Belum Ditunjuk'}</p>
                    </div>
                </div>

                {/* DOKUMEN LINKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-3 rounded-md flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded"><FileText className="w-4 h-4 text-slate-600"/></div>
                            <div className="text-xs">
                                <span className="block font-medium text-slate-700">Surat Permintaan (Op)</span>
                                <span className="text-slate-400">{selectedLitmasDetail?.file_surat_permintaan_url ? 'Tersedia' : 'Belum upload'}</span>
                            </div>
                        </div>
                        {selectedLitmasDetail?.file_surat_permintaan_url && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(selectedLitmasDetail.file_surat_permintaan_url, '_blank')}>
                                <ExternalLink className="w-3 h-3 mr-1"/> Lihat
                            </Button>
                        )}
                    </div>
                    <div className="border p-3 rounded-md flex items-center justify-between hover:bg-blue-50/50 transition-colors border-blue-100 bg-blue-50/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded"><FileClock className="w-4 h-4 text-blue-600"/></div>
                            <div className="text-xs">
                                <span className="block font-medium text-blue-800">Hasil Laporan (PK)</span>
                                <span className="text-blue-400">{selectedLitmasDetail?.hasil_litmas_url ? 'Siap Unduh' : 'Dalam Proses'}</span>
                            </div>
                        </div>
                        {selectedLitmasDetail?.hasil_litmas_url && (
                            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => window.open(selectedLitmasDetail.hasil_litmas_url, '_blank')}>
                                <ExternalLink className="w-3 h-3 mr-1"/> Lihat
                            </Button>
                        )}
                    </div>
                </div>

                {/* TIMELINE HISTORY VISUALIZATION */}
                <div className="border rounded-lg p-5 bg-white shadow-sm">
                    <h4 className="text-sm font-bold mb-5 flex items-center gap-2 text-slate-800">
                        <History className="w-4 h-4 text-blue-600"/> Riwayat Pengerjaan
                    </h4>
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                        
                        {/* 1. Registrasi */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_registrasi ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Registrasi Operator</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(selectedLitmasDetail?.waktu_registrasi)}</p>
                            </div>
                        </div>

                        {/* 2. Upload Surat Tugas */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_upload_surat_tugas ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">PK: Menerima Tugas</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedLitmasDetail?.waktu_upload_surat_tugas ? formatDateTime(selectedLitmasDetail.waktu_upload_surat_tugas) : 'Menunggu PK...'}</p>
                            </div>
                        </div>

                        {/* 3. Upload Laporan */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_upload_laporan ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">PK: Upload Laporan</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedLitmasDetail?.waktu_upload_laporan ? formatDateTime(selectedLitmasDetail.waktu_upload_laporan) : 'Dalam Pengerjaan...'}</p>
                            </div>
                        </div>

                        {/* 4. Verifikasi */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_verifikasi_anev ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Kasie/Anev: Verifikasi</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedLitmasDetail?.waktu_verifikasi_anev ? formatDateTime(selectedLitmasDetail.waktu_verifikasi_anev) : 'Menunggu Verifikasi...'}</p>
                            </div>
                        </div>

                        {/* 5. Sidang */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_sidang_tpp ? 'bg-purple-600' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Sidang TPP</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedLitmasDetail?.waktu_sidang_tpp ? formatDateTime(selectedLitmasDetail.waktu_sidang_tpp) : 'Belum Sidang'}</p>
                            </div>
                        </div>

                        {/* 6. Selesai */}
                        <div className="ml-8 relative">
                            <div className={`absolute -left-[39px] w-5 h-5 rounded-full border-4 border-white shadow-sm ${selectedLitmasDetail?.waktu_selesai ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-blue-700">Selesai</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{selectedLitmasDetail?.waktu_selesai ? formatDateTime(selectedLitmasDetail.waktu_selesai) : '-'}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </TestPageLayout>
  );
}