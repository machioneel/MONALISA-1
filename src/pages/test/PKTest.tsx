import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // TAMBAHAN: Import Tabs
import { Input } from "@/components/ui/input";
import { User, ListFilter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Import Komponen Pecahan
import { PKStatsCards } from '@/components/pk/FormPK/FormLitmas/PKStatsCards';
import { PKTaskTable } from '@/components/pk/FormPK/FormLitmas/PKTaskTable';
import { PKRegisterDialog } from '@/components/pk/FormPK/FormLitmas/PKRegisterDialog';
import { PKDetailDialog } from '@/components/pk/FormPK/FormLitmas/PKDetailDialog';

// --- 1. DEFINISI TIPE MANUAL ---
interface LitmasTaskData {
  id_litmas: number;
  created_at: string;
  updated_at: string | null;
  status: string | null;
  jenis_litmas: string | null;
  kategori_layanan: string | null; // TAMBAHAN: Untuk filter tab
  nomor_surat_permintaan: string | null;
  surat_tugas_signed_url: string | null;
  hasil_litmas_url: string | null;
  waktu_registrasi: string | null;
  waktu_upload_surat_tugas: string | null;
  waktu_upload_laporan: string | null;
  waktu_verifikasi_anev: string | null;
  waktu_sidang_tpp: string | null;
  waktu_selesai: string | null;
  asal_bapas: string | null;
  
  id_anev?: string | null; 
  assigned_anev_id?: string | null; 

  klien: {
    nama_klien: string;
    nomor_register_lapas: string;
    kategori_usia: string;
    penjamin?: {
      nama_penjamin: string | null;
      nomor_telepon: string | null;
      hubungan_klien: string | null;
      alamat: string | null;
    }[] | null;
  } | null;
  petugas_pk: {
    nama: string;
    nip: string;
  } | null;
  jadwal: {
    tanggal_sidang: string;
    jenis_sidang: string;
  } | null;
}

// --- 2. FUNGSI FETCHER ---
async function getLitmasTasksExternal(client: any, userId: string, isAdmin: boolean) {
    let pkId = null;
    
    if (!isAdmin) {
        const { data, error } = await client.from('petugas_pk').select('id, nama').eq('user_id', userId).maybeSingle();
        if (error || !data) return { data: [], error: error || 'PK Not Found' };
        pkId = data.id;
    }

    let query = client
        .from('litmas')
        .select(`
            *,
            klien:klien!litmas_id_klien_fkey (
                nama_klien, 
                nomor_register_lapas, 
                kategori_usia,
                penjamin (
                    nama_penjamin,
                    nomor_telepon,
                    hubungan_klien,
                    alamat
                )
            ),
            petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip),
            jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)
        `)
        .order('created_at', { ascending: false });

    if (!isAdmin && pkId) {
        query = query.eq('nama_pk', pkId);
    } else if (!isAdmin && !pkId) {
        return { data: [], error: null };
    }

    return await query;
}

// --- 3. KOMPONEN UTAMA ---
export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const [tasks, setTasks] = useState<LitmasTaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedLitmasId, setSelectedLitmasId] = useState<number | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // TAMBAHAN: State untuk Tab aktif
  const [activeTab, setActiveTab] = useState<string>("litmas");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pkName, setPkName] = useState("");

  const isAdmin = hasRole('admin');

  // --- MAIN FETCH ---
  const fetchMyTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await getLitmasTasksExternal((supabase as any), user.id, isAdmin);
      if (error) throw error;
      
      if (data) setTasks(data as unknown as LitmasTaskData[]);

      if (!isAdmin) {
        //@ts-ignore
          const { data: pkData } = await supabase.from('petugas_pk').select('nama').eq('user_id', user.id).single();
          if (pkData) setPkName(pkData.nama);
      } else {
          setPkName("Administrator");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Fetch", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasks(); 
      const fetchSchedules = async () => {
          const { data } = await (supabase as any)
            .from('tpp_schedules').select('*').eq('status', 'Open').gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // --- ACTIONS ---
  const handleUpload = async (file: File, taskId: number, type: 'surat_tugas' | 'hasil_litmas') => {
    setUploadingId(taskId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}/${taskId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw new Error(`Upload Gagal: ${upErr.message}`);

      let updateData: any = {};
      if (type === 'surat_tugas') {
          updateData = { surat_tugas_signed_url: path, status: 'On Progress', waktu_upload_surat_tugas: new Date().toISOString() };
      } else {
          updateData = { hasil_litmas_url: path, status: 'Review', anev_notes: null, waktu_upload_laporan: new Date().toISOString() };
      }

      const { error: dbError } = await supabase.from('litmas').update(updateData).eq('id_litmas', taskId);
      if (dbError) throw new Error(`Update DB Gagal: ${dbError.message}`);

      toast({ title: "Berhasil", description: type === 'surat_tugas' ? "Surat Tugas diupload" : "File berhasil diupload" });
      fetchMyTasks(); 
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Memproses", description: e.message });
    } finally {
      setUploadingId(null);
    }
  };

  const openRegisterDialog = (id: number) => {
      setSelectedLitmasId(id);
      setSelectedScheduleId('');
      setIsRegisterOpen(true);
  };

  const confirmRegisterTPP = async () => {
      if (!selectedScheduleId || !selectedLitmasId) return toast({ variant: "destructive", title: "Pilih jadwal dulu!" });
      const { error } = await (supabase as any).from('litmas').update({ status: 'TPP Scheduled', tpp_schedule_id: selectedScheduleId, waktu_daftar_tpp: new Date().toISOString() }).eq('id_litmas', selectedLitmasId);

      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else {
          toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." });
          setIsRegisterOpen(false);
          fetchMyTasks();
      }
  };

  // --- FILTERING LOGIC ---
  // 1. Filter berdasarkan Tab Kategori Layanan (Litmas, Pendampingan, Pengawasan, Pembimbingan)
  // Perhatikan: Jika data lama tidak memiliki kategori, kita asumsikan sebagai 'litmas'
  const tabFilteredTasks = tasks.filter(t => {
      const category = t.kategori_layanan ? t.kategori_layanan.toLowerCase() : 'litmas';
      return category === activeTab;
  });

  // 2. Filter lanjutan berdasarkan text search
  const filteredTasks = tabFilteredTasks.filter(t => 
    (t.klien?.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.klien?.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats hanya menghitung untuk Tab yang sedang aktif agar lebih relevan
  const stats = {
      new: tabFilteredTasks.filter(t => !t.status || t.status === 'New Task').length,
      process: tabFilteredTasks.filter(t => t.status === 'On Progress' || t.status === 'Revision').length,
      review: tabFilteredTasks.filter(t => t.status === 'Review').length,
      done: tabFilteredTasks.filter(t => ['Approved', 'TPP Scheduled', 'Selesai'].includes(t.status || '')).length
  };

  return (
    <TestPageLayout title="Dashboard PK" description="Manajemen Tugas & Layanan Klien" permissionCode="access_pk" icon={<User className="w-8 h-8 text-primary" />}>
      <div className="space-y-6">
        
        <PKStatsCards stats={stats} />

        <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ListFilter className="w-5 h-5 text-primary"/> Daftar Tugas Layanan
                    </CardTitle>
                    <CardDescription>Kelola pekerjaan Anda berdasarkan jenis layanannya.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama atau register..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* TAMBAHAN: TAB SUB MENU */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-4 pb-2 bg-slate-50/30">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="litmas" className="py-2">Litmas</TabsTrigger>
                        <TabsTrigger value="pendampingan" className="py-2">Pendampingan</TabsTrigger>
                        <TabsTrigger value="pengawasan" className="py-2">Pengawasan</TabsTrigger>
                        <TabsTrigger value="pembimbingan" className="py-2">Pembimbingan</TabsTrigger>
                    </TabsList>
                </div>

                {/* Karena tabelnya sama, kita bisa render satu tabel saja, datanya sudah ter-filter oleh filteredTasks di atas */}
                <div className="p-0">
                    <PKTaskTable 
                        tasks={filteredTasks} 
                        loading={loading}
                        onViewDetail={(task) => { setSelectedTask(task); setIsDetailOpen(true); }}
                        onUpload={handleUpload} 
                        onOpenRegister={openRegisterDialog}
                    />
                </div>
            </Tabs>
          </CardContent>
        </Card>

        <PKRegisterDialog 
            isOpen={isRegisterOpen} 
            onOpenChange={setIsRegisterOpen} 
            schedules={availableSchedules}
            selectedScheduleId={selectedScheduleId}
            onSelectSchedule={setSelectedScheduleId}
            onConfirm={confirmRegisterTPP}
        />
        
        <PKDetailDialog 
            isOpen={isDetailOpen} 
            onOpenChange={setIsDetailOpen} 
            task={selectedTask}
            onRefresh={fetchMyTasks} 
        />
      </div>
    </TestPageLayout>
  );
}