// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    User, ListFilter, Search, Camera, CheckCircle2, Eye, 
    Plus, AlertCircle, Phone, History, Clock, FileText, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { PKStatsCards } from '@/components/pk/FormPK/FormLitmas/PKStatsCards';
import { PKTaskTable } from '@/components/pk/FormPK/FormLitmas/PKTaskTable';
import { PKRegisterDialog } from '@/components/pk/FormPK/FormLitmas/PKRegisterDialog';
import { PKDetailDialog } from '@/components/pk/FormPK/FormLitmas/PKDetailDialog';
import { DataKlienDialog } from '@/components/pk/FormPK/DetailKlien/DataKlienDialog';
import { PKPembimbinganTable } from '@/components/pk/FormPK/FormPembimbingan/PKPembimbinganTable';

// IMPORT KOMPONEN DIALOG WAJIB LAPOR YANG BARU DIPISAHKAN
import { PKWajibLaporDialog } from '@/components/pk/FormPK/FormPembimbingan/PKWajibLaporDialog';

export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [wajibLaporList, setWajibLaporList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  
  // Dialog States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<string>("litmas");

  // Wajib Lapor History States
  const [laporSubTab, setLaporSubTab] = useState<string>("approvement");
  const [historyClient, setHistoryClient] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Wajib Lapor Form Trigger States (Sisa state untuk memanggil komponen baru)
  const [openLaporDialog, setOpenLaporDialog] = useState(false);
  const [selectedLaporClient, setSelectedLaporClient] = useState<string>("");
  const [selectedLaporPhone, setSelectedLaporPhone] = useState<string>("");

  const [pkName, setPkName] = useState("");
  const isAdmin = hasRole('admin');

  const eligibleLaporClients = Array.from(
    new Map(
        tasks
        .filter(t => {
            if (t.tabel_sumber === 'litmas') return ['Approved', 'Selesai'].includes(t.status || '');
            return true; 
        })
        .filter(t => t.klien && t.id_klien)
        .map(t => [t.id_klien, { ...t.klien, id_klien: t.id_klien }])
    ).values()
  );

  const fetchMyTasksAndLapor = async () => {
    if (!user) return;
    setLoading(true);
    try {
        let pkId = null;
        if (!isAdmin) {
            const { data } = await supabase.from('petugas_pk').select('id, nama').eq('user_id', user.id).maybeSingle(); 
            if (data) { pkId = data.id; setPkName(data.nama); }
            else return;
        } else { setPkName("Administrator"); }

        const tables = [ 'pendampingan', 'litmas', 'pembimbingan', 'pengawasan'];

        const fetchPromises = tables.map(async (table) => {
            let selectQuery = "";
            
            if (table === 'litmas') {
                selectQuery = `*, klien:klien!litmas_id_klien_fkey (id_klien, nama_klien, nik_klien, nomor_register_lapas, kategori_usia, nomor_telepon, agama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, alamat, penjamin (nama_penjamin, nomor_telepon, hubungan_klien, alamat)), petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip), jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)`;
            } else {
                selectQuery = `*, klien (id_klien, nama_klien, nik_klien, nomor_register_lapas, kategori_usia, nomor_telepon, agama, tempat_lahir, tanggal_lahir, pendidikan, pekerjaan, alamat, penjamin (nama_penjamin, nomor_telepon, hubungan_klien, alamat)), petugas_pk (nama, nip)`;
            }

            let query = (supabase as any).from(table).select(selectQuery);
            if (!isAdmin && pkId) query = query.eq('nama_pk', pkId);
            
            const { data, error } = await query;
            if (error) { 
                console.error(`Error fetching ${table}:`, error.message); 
                return []; 
            }
            
            return (data || []).map((item: any) => ({
                ...item,
                id_layanan: item[`id_${table}`] || item.id_litmas,
                id_litmas: item[`id_${table}`] || item.id_litmas, 
                tabel_sumber: table,
                jadwal: item.jadwal || null
            }));
        });

        const results = await Promise.all(fetchPromises);
        const allTasks = results.flat();
        
        allTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(allTasks);

        const eligibleClientIds = Array.from(new Set(allTasks.filter((t: any) => {
            if (t.tabel_sumber === 'litmas') return ['Approved', 'Selesai'].includes(t.status || '');
            return true;
        }).filter((t: any) => t.id_klien).map((t: any) => t.id_klien)));
        
        let wQuery = (supabase as any).from('wajib_lapor').select(`*, klien (id_klien, nama_klien, nik_klien, nomor_register_lapas, nomor_telepon)`).order('tanggal_lapor', { ascending: false });
        
        if (!isAdmin && pkId) {
            if (eligibleClientIds.length > 0) {
                wQuery = wQuery.in('id_klien', eligibleClientIds);
            } else {
                wQuery = wQuery.eq('id_klien', -1); 
            }
        }
        
        const { data: wData } = await wQuery;
        if (wData) {
            const uniqueLapor = Array.from(new Map(wData.map((item:any) => [item.id, item])).values());
            setWajibLaporList(uniqueLapor);
        }

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error Fetch", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasksAndLapor(); 
      const fetchSchedules = async () => {
          const { data } = await (supabase as any)
            .from('tpp_schedules').select('*').eq('status', 'Open').gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const handleUpload = async (file: File, task: any, type: 'surat_tugas' | 'hasil_litmas', customDate?: string) => {
    const id = task.id_layanan;
    const table = task.tabel_sumber || 'litmas';
    
    setUploadingId(id);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}/${table}_${id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw new Error(`Upload Gagal: ${upErr.message}`);

      let updateData: any = {};
      
      if (type === 'surat_tugas') { 
          updateData = { 
              surat_tugas_signed_url: path, 
              status: 'On Progress', 
              waktu_upload_surat_tugas: new Date().toISOString() 
          }; 
          if (customDate) {
              updateData.waktu_tunjuk_pk = new Date(customDate).toISOString(); 
          }
      } else { 
          updateData = { 
              hasil_litmas_url: path, 
              status: 'Review', 
              anev_notes: null, 
              waktu_upload_laporan: new Date().toISOString() 
          }; 
      }

      await supabase.from(table).update(updateData).eq(`id_${table}`, id);
      
      toast({ title: "Berhasil", description: type === 'surat_tugas' ? "Surat Tugas diupload" : "File berhasil diupload" });
      fetchMyTasksAndLapor(); 
    } catch (e: any) { 
        toast({ variant: "destructive", title: "Gagal Memproses", description: e.message }); 
    } finally { 
        setUploadingId(null); 
    }
  };

  const openRegisterDialog = (task: any) => { 
      setSelectedTask(task);
      setSelectedScheduleId(''); 
      setIsRegisterOpen(true); 
  };

  const confirmRegisterTPP = async () => {
      if (!selectedScheduleId || !selectedTask) return toast({ variant: "destructive", title: "Pilih jadwal dulu!" });
      
      const tableName = selectedTask.tabel_sumber || 'litmas';
      const pkColumn = `id_${tableName}`;

      const { error } = await (supabase as any).from(tableName).update({ 
          status: 'TPP Scheduled', 
          tpp_schedule_id: selectedScheduleId, 
          waktu_daftar_tpp: new Date().toISOString() 
      }).eq(pkColumn, selectedTask.id_layanan);
      
      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else { toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." }); setIsRegisterOpen(false); fetchMyTasksAndLapor(); }
  };

  const handleValidasiLapor = async (idLapor: number) => {
      try {
          const { error } = await (supabase as any).from('wajib_lapor').update({
              status_validasi: 'Valid'
          }).eq('id', idLapor);
          
          if (error) throw error;
          toast({ title: "Berhasil Divalidasi", description: "Laporan klien ini telah disahkan." });
          fetchMyTasksAndLapor();
      } catch (error: any) {
          toast({ variant: "destructive", title: "Gagal Validasi", description: error.message });
      }
  };

  const groupedClients = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
        if (!task.klien || !task.id_klien) return;
        
        const clientId = task.id_klien;
        if (!map.has(clientId)) {
            map.set(clientId, {
                ...task.klien,
                id_klien: clientId,
                layanan_list: []
            });
        }
        
        map.get(clientId).layanan_list.push({
            id_layanan: task.id_layanan,
            jenis_litmas: task.jenis_litmas,
            kategori_layanan: task.tabel_sumber,
            status: task.status,
            waktu_registrasi: task.waktu_registrasi,
            nama_pk: task.petugas_pk?.nama || 'Belum Ditunjuk'
        });
    });

    map.forEach(client => {
        client.layanan_list.sort((a: any, b: any) => new Date(b.waktu_registrasi).getTime() - new Date(a.waktu_registrasi).getTime());
    });

    return Array.from(map.values()).filter((c: any) => 
        (c.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nik_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);


  const tabFilteredTasks = tasks.filter(t => {
      const category = t.tabel_sumber ? t.tabel_sumber.toLowerCase() : 'litmas';
      return category === activeTab;
  });

  const filteredTasks = tabFilteredTasks.filter(t => 
      (t.klien?.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.klien?.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.klien?.nik_klien || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWajibLaporList = wajibLaporList.filter(wl => 
      (wl.klien?.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wl.klien?.nik_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wl.klien?.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEligibleClients = eligibleLaporClients.filter((c: any) => 
      (c.nama_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nik_klien || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nomor_register_lapas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculatedStats = {
      litmasBaru: tasks.filter(t => t.tabel_sumber === 'litmas' && (!t.status || t.status === 'New Task')).length,
      litmasProses: tasks.filter(t => t.tabel_sumber === 'litmas' && ['On Progress', 'Revision', 'Review'].includes(t.status || '')).length,
      litmasSelesai: tasks.filter(t => t.tabel_sumber === 'litmas' && ['Approved', 'TPP Scheduled', 'TPP Disetujui', 'Selesai'].includes(t.status || '')).length,
      pendampinganAktif: tasks.filter(t => t.tabel_sumber === 'pendampingan' && t.status !== 'Selesai').length,
      jadwalSidang: tasks.filter(t => t.tabel_sumber === 'pendampingan' && t.status === 'TPP Scheduled').length,
      pendampinganSelesai: tasks.filter(t => t.tabel_sumber === 'pendampingan' && t.status === 'Selesai').length,
      pembimbinganAktif: tasks.filter(t => t.tabel_sumber === 'pembimbingan' && t.status !== 'Selesai').length,
      wajibLaporHariIni: wajibLaporList.filter(wl => new Date(wl.tanggal_lapor).toDateString() === new Date().toDateString()).length,
      pembimbinganSelesai: tasks.filter(t => t.tabel_sumber === 'pembimbingan' && t.status === 'Selesai').length,
      totalKlien: groupedClients.length,
      tugasAktif: tasks.filter(t => !['Approved', 'Selesai'].includes(t.status || '')).length,
  };

  return (
    <TestPageLayout title="Dashboard PK" description="Manajemen Tugas & Layanan Klien" permissionCode="access_pk" icon={<User className="w-8 h-8 text-primary" />}>
      <div className="space-y-6">
        
        <PKStatsCards activeTab={activeTab} stats={calculatedStats} />

        <Card className="shadow-md border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ListFilter className="w-5 h-5 text-primary"/> Modul Bimbingan
                    </CardTitle>
                    <CardDescription>Kelola pekerjaan dan lapor klien.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari nama, reg, atau NIK..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-4 pb-2 bg-slate-50/30 overflow-x-auto">
                    <TabsList className="grid w-full min-w-[600px] grid-cols-6 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="pendampingan" className="py-2">Pendampingan</TabsTrigger>
                        <TabsTrigger value="litmas" className="py-2">Litmas</TabsTrigger>
                        <TabsTrigger value="pembimbingan" className="py-2">Pembimbingan</TabsTrigger>
                        <TabsTrigger value="pengawasan" className="py-2">Pengawasan</TabsTrigger>
                        <TabsTrigger value="data_klien" className="py-2 flex items-center gap-2 text-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-50">
                            <User className="w-4 h-4"/> Data Klien
                        </TabsTrigger>
                        <TabsTrigger value="wajib_lapor" className="py-2 flex items-center gap-2 text-emerald-600 data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50">
                            <Camera className="w-4 h-4"/> Lapor
                        </TabsTrigger>
                    </TabsList>
                </div>

                {activeTab === 'data_klien' ? (
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">Menampilkan seluruh klien yang pernah atau sedang Anda tangani di semua jenis layanan.</p>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead>Identitas Klien</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Total Layanan</TableHead>
                                        <TableHead>Layanan Terakhir</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedClients.map((klien: any, index) => {
                                        const lastService = klien.layanan_list[0]; 
                                        return (
                                        <TableRow key={klien.id_klien}>
                                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800">{klien.nama_klien}</span>
                                                    <span className="text-xs text-slate-500 font-mono">Reg: {klien.nomor_register_lapas || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                                    {klien.kategori_usia || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                                    {klien.layanan_list.length} Layanan
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-xs font-semibold text-slate-700">{lastService?.jenis_litmas || '-'}</span>
                                                    <Badge variant="outline" className="text-[10px] bg-slate-50">Status: {lastService?.status || '-'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedClientDetail(klien);
                                                        setIsClientDetailOpen(true);
                                                    }}
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> Detail Profil
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                    {groupedClients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-slate-500 italic">
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /> : "Belum ada data klien yang ditemukan."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : activeTab === 'pembimbingan' ? (
                    <div className="p-0">
                        <PKPembimbinganTable 
                            tasks={filteredTasks} 
                            loading={loading} 
                            onRefresh={fetchMyTasksAndLapor}
                            openLaporDialog={(task) => {
                                setSelectedLaporClient(String(task.id_klien));
                                setSelectedLaporPhone(task.klien?.nomor_telepon || "");
                                setOpenLaporDialog(true);
                            }}
                        />
                    </div>
                ) : activeTab !== 'wajib_lapor' ? (
                    <div className="p-0">
                        <PKTaskTable tasks={filteredTasks} loading={loading} onViewDetail={(task) => { setSelectedTask(task); setIsDetailOpen(true); }} onUpload={handleUpload} onOpenRegister={openRegisterDialog} />
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                            <p className="text-sm text-emerald-800">Menampilkan modul wajib lapor dari klien yang Anda dampingi secara aktif.</p>
                            <Button onClick={() => {
                                setSelectedLaporClient("");
                                setSelectedLaporPhone("");
                                setOpenLaporDialog(true);
                            }} className="gap-2 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                                <Plus className="w-4 h-4"/> Buat Laporan Kehadiran
                            </Button>
                        </div>
                        
                        <Tabs value={laporSubTab} onValueChange={setLaporSubTab} className="w-full">
                            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl mb-4">
                                <TabsTrigger value="approvement">Approvement Wajib Lapor</TabsTrigger>
                                <TabsTrigger value="daftar_klien">Daftar Klien</TabsTrigger>
                            </TabsList>

                            <TabsContent value="approvement" className="m-0 border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Tgl Lapor</TableHead>
                                            <TableHead>Klien / Reg</TableHead>
                                            <TableHead>Keterangan & Status</TableHead>
                                            <TableHead>Bukti</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredWajibLaporList.map((wl) => (
                                            <TableRow key={wl.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {new Date(wl.tanggal_lapor).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col min-w-[150px]">
                                                        <span className="font-semibold text-slate-800">{wl.klien?.nama_klien}</span>
                                                        <span className="text-[10px] text-slate-500">Reg: {wl.klien?.nomor_register_lapas} {wl.klien?.nik_klien ? `• NIK: ${wl.klien?.nik_klien}` : ''}</span>
                                                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1"><Phone className="w-2.5 h-2.5"/> {wl.klien?.nomor_telepon || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start max-w-[200px]">
                                                        <span className="text-sm italic text-slate-600 truncate w-full">{wl.keterangan || '-'}</span>
                                                        <Badge className={cn("text-[10px]", 
                                                            wl.status_validasi === 'Valid' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                                        )}>
                                                            {wl.status_validasi === 'Valid' ? <CheckCircle2 className="w-3 h-3 mr-1"/> : <AlertCircle className="w-3 h-3 mr-1"/>}
                                                            {wl.status_validasi || 'Menunggu Validasi'}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" onClick={() => setPreviewImage(wl.foto_url)} className="gap-2 h-8 text-blue-600 border-blue-200 hover:bg-blue-50"><Eye className="w-3.5 h-3.5"/> Cek Foto</Button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {wl.status_validasi !== 'Valid' ? (
                                                        <Button size="sm" onClick={() => handleValidasiLapor(wl.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1"><CheckCircle2 className="w-4 h-4"/> Validasi</Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" disabled className="text-emerald-600 h-8 gap-1"><CheckCircle2 className="w-4 h-4"/> Disahkan</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredWajibLaporList.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada wajib lapor yang cocok dengan pencarian.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="daftar_klien" className="m-0 border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Klien / Reg</TableHead>
                                            <TableHead>Kontak Klien</TableHead>
                                            <TableHead>Total Lapor</TableHead>
                                            <TableHead>Terakhir Lapor</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEligibleClients.map((c: any) => {
                                            const clientReports = wajibLaporList.filter(wl => wl.id_klien === c.id_klien);
                                            const lastReport = clientReports.length > 0 ? clientReports[0] : null;

                                            return (
                                            <TableRow key={c.id_klien}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">{c.nama_klien}</span>
                                                        <span className="text-[10px] text-slate-500">Reg: {c.nomor_register_lapas} {c.nik_klien ? `• NIK: ${c.nik_klien}` : ''}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-emerald-600 flex items-center gap-1"><Phone className="w-3 h-3"/> {c.nomor_telepon || '-'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{clientReports.length} Kali Lapor</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {lastReport ? (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                {new Date(lastReport.tanggal_lapor).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className={cn("text-[10px]", lastReport.status_validasi === 'Valid' ? "text-emerald-600" : "text-amber-600")}>
                                                                Status: {lastReport.status_validasi || 'Menunggu'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Belum pernah lapor</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => setHistoryClient(c)} className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                                                        <History className="w-4 h-4"/> Riwayat Lapor
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                        {filteredEligibleClients.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada klien yang aktif wajib lapor atau cocok dengan pencarian.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>

                    </div>
                )}
            </Tabs>
          </CardContent>
        </Card>

        {/* --- KOMPONEN DIALOG BARU (MENGGANTIKAN FORM LAMA) --- */}
        <PKWajibLaporDialog
          isOpen={openLaporDialog}
          onOpenChange={setOpenLaporDialog}
          eligibleClients={eligibleLaporClients}
          onSuccess={fetchMyTasksAndLapor}
          initialClientId={selectedLaporClient}
          initialPhone={selectedLaporPhone}
        />

        {/* Dialog History (Dibuka dari tabel Daftar Klien Wajib Lapor) */}
        <Dialog open={!!historyClient} onOpenChange={(open) => !open && setHistoryClient(null)}>
            <DialogContent className="max-w-3xl bg-slate-50/50">
                <DialogHeader className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-600"/> Riwayat Wajib Lapor Klien
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 mt-4 custom-scrollbar">
                    {wajibLaporList.filter(wl => wl.id_klien === historyClient?.id_klien).map((lapor, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <div className="w-24 h-24 shrink-0 rounded bg-slate-100 overflow-hidden border border-slate-300">
                                {lapor.foto_url ? (
                                    <img src={lapor.foto_url} alt="Bukti" className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition" onClick={() => setPreviewImage(lapor.foto_url)} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Pic</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">{new Date(lapor.tanggal_lapor).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                <Badge variant="outline" className={cn("text-[10px] mt-1.5 font-medium", lapor.status_validasi === 'Valid' ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200")}>
                                    {lapor.status_validasi || 'Menunggu'}
                                </Badge>
                                <div className="mt-2.5 p-2 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-xs text-slate-600 italic leading-relaxed">"{lapor.keterangan || 'Tidak ada keterangan'}"</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {wajibLaporList.filter(wl => wl.id_klien === historyClient?.id_klien).length === 0 && (
                        <p className="text-center text-slate-500 py-8 text-sm italic">Belum ada riwayat wajib lapor untuk klien ini.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* Dialog Preview Foto Lapor */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-md p-4">
                <DialogHeader><DialogTitle>Pratinjau Bukti Wajib Lapor</DialogTitle></DialogHeader>
                <div className="flex flex-col items-center justify-center p-2 rounded bg-slate-100 mt-2">
                    <img src={previewImage || ''} alt="Wajib Lapor" className="w-full h-auto object-cover rounded-md" />
                </div>
            </DialogContent>
        </Dialog>

        {/* --- KOMPONEN DIALOG BAWAHAN LAINNYA --- */}
        <DataKlienDialog 
            isOpen={isClientDetailOpen} 
            onOpenChange={setIsClientDetailOpen} 
            clientData={selectedClientDetail} 
        />
        
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
            onRefresh={fetchMyTasksAndLapor} 
        />

      </div>
    </TestPageLayout>
  );
}