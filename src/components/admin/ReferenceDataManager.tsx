// src/components/admin/ReferenceDataManager.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Database, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";

// --- 1. DEFINISI TIPE DATA (INTERFACE) ---
interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "number" | "relation";
  relationTable?: string;
  relationKey?: string;
  relationLabel?: string;
}

interface TableConfig {
  label: string;
  primaryKey: string;
  columns: ColumnConfig[];
}

// --- 2. KONFIGURASI TABEL ---
const TABLE_CONFIGS: Record<string, TableConfig> = {
  ref_bapas: {
    label: "Referensi Bapas",
    primaryKey: "id_bapas",
    columns: [
      { key: "nama_bapas", label: "Nama Bapas", type: "text" },
      { key: "wilayah_kerja", label: "Wilayah Kerja", type: "text" }
    ]
  },
  ref_golongan: {
    label: "Referensi Golongan",
    primaryKey: "id_golongan",
    columns: [
      { key: "kode", label: "Kode Golongan", type: "text" },
      { key: "pangkat", label: "Nama Pangkat", type: "text" }
    ]
  },
  ref_hubungan: {
    label: "Ref. Hubungan Keluarga",
    primaryKey: "id_hubungan",
    columns: [
      { key: "nama_hubungan", label: "Sebutan Hubungan", type: "text" }
    ]
  },
  ref_kategori_surat: {
    label: "Ref. Kategori Surat",
    primaryKey: "id_kategori_surat",
    columns: [
      { key: "nama_kategori", label: "Nama Kategori", type: "text" }
    ]
  },
  ref_kecamatan: {
    label: "Ref. Kecamatan",
    primaryKey: "id_kecamatan",
    columns: [
      { key: "nama_kecamatan", label: "Nama Kecamatan", type: "text" },
      { key: "kota_id", label: "ID Kota", type: "number" }
    ]
  },
  ref_kelurahan: {
    label: "Ref. Kelurahan",
    primaryKey: "id_kelurahan",
    columns: [
      { key: "nama_kelurahan", label: "Nama Kelurahan", type: "text" },
      { 
        key: "kecamatan_id", 
        label: "Kecamatan", 
        type: "relation", 
        relationTable: "ref_kecamatan", 
        relationKey: "id_kecamatan", 
        relationLabel: "nama_kecamatan" 
      } 
    ]
  },
  ref_pekerjaan: {
    label: "Ref. Pekerjaan",
    primaryKey: "id_pekerjaan",
    columns: [
      { key: "nama_pekerjaan", label: "Nama Pekerjaan", type: "text" }
    ]
  },
  ref_pendidikan: {
    label: "Ref. Pendidikan",
    primaryKey: "id_pendidikan",
    columns: [
      { key: "tingkat", label: "Tingkat Pendidikan", type: "text" }
    ]
  },
  ref_upt: {
    label: "Ref. UPT (Lapas/Rutan)",
    primaryKey: "id_upt",
    columns: [
      { key: "nama_upt", label: "Nama UPT", type: "text" },
      { key: "jenis_instansi", label: "Jenis Instansi", type: "text" }
    ]
  },
  ref_perkara: {
    label: "Ref. Perkara / Tindak Pidana",
    primaryKey: "id_perkara",
    columns: [
      { key: "aturan_uu", label: "Aturan UU", type: "text" },
      { key: "pasal", label: "Pasal", type: "text" },
      { key: "ayat", label: "Ayat", type: "text" },
      { key: "nama_perkara", label: "Nama Perkara", type: "text" },
      { key: "kategori", label: "Kategori", type: "text" }
    ]
  }
};

type TableKey = keyof typeof TABLE_CONFIGS;

export function ReferenceDataManager() {
  const { toast } = useToast();
  
  // State Selection
  const [selectedTable, setSelectedTable] = useState<TableKey>("ref_kelurahan");
  const config = TABLE_CONFIGS[selectedTable];

  // State Data
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State Pagination & Rows Per Page
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State Relations
  const [relationsData, setRelationsData] = useState<Record<string, any[]>>({});

  // State Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = (supabase as any).from(selectedTable).select('*');
      const { data: result, error } = await query.order(config.primaryKey, { ascending: true });
      if (error) throw error;

      const newRelations: Record<string, any[]> = {};
      for (const col of config.columns) {
        if (col.type === 'relation' && col.relationTable) {
            const { data: relData } = await (supabase as any).from(col.relationTable).select('*');
            newRelations[col.key] = relData || [];
        }
      }
      
      setRelationsData(newRelations);
      setData(result || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchTerm("");
    setCurrentPage(1); // Reset ke halaman 1 saat ganti tabel
  }, [selectedTable]);

  // Handle CRUD
  const handleOpenDialog = (item?: any) => {
    if (item) {
        setEditingId(item[config.primaryKey]);
        setFormData({ ...item });
    } else {
        setEditingId(null);
        setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
        let error;
        if (editingId) {
            const { error: err } = await (supabase as any).from(selectedTable).update(formData).eq(config.primaryKey, editingId);
            error = err;
        } else {
            const { error: err } = await (supabase as any).from(selectedTable).insert([formData]);
            error = err;
        }
        if (error) throw error;
        toast({ title: "Sukses", description: "Data berhasil disimpan." });
        setIsDialogOpen(false);
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
        const { error } = await (supabase as any).from(selectedTable).delete().eq(config.primaryKey, id);
        if (error) throw error;
        toast({ title: "Terhapus", description: "Data berhasil dihapus." });
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Gagal Hapus", description: "Data sedang digunakan." });
    }
  };

  const getRelationLabel = (colKey: string, value: any) => {
    const colConfig = config.columns.find(c => c.key === colKey);
    if (colConfig?.type === 'relation' && colConfig.relationKey && colConfig.relationLabel && relationsData[colKey]) {
        const found = relationsData[colKey].find(r => String(r[colConfig.relationKey!]) === String(value));
        return found ? found[colConfig.relationLabel!] : value; 
    }
    return value;
  };

  // Logic Filtering & Pagination
  const filteredData = data.filter(item => 
    config.columns.some(col => {
      const val = col.type === 'relation' ? getRelationLabel(col.key, item[col.key]) : item[col.key];
      return String(val || "").toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Database className="w-5 h-5 text-blue-600"/> Manajemen Data Referensi
            </h2>
            <p className="text-sm text-slate-500">Kelola master data sistem dropdown.</p>
        </div>
        <div className="w-full md:w-64">
            <Select value={selectedTable} onValueChange={(val) => setSelectedTable(val as TableKey)}>
                <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Pilih Tabel" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(TABLE_CONFIGS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold">{config.label}</CardTitle>
                <Button size="sm" onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="w-4 h-4 mr-2"/> Tambah Data
                </Button>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder={`Cari di ${config.label}...`}
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                {/* OPSI JUMLAH DATA */}
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-500 whitespace-nowrap">Tampilkan:</Label>
                    <Select value={String(rowsPerPage)} onValueChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[80px] h-9 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[60px] text-xs font-bold uppercase tracking-wider">ID</TableHead>
                        {config.columns.map(col => (
                            <TableHead key={col.key} className="text-xs font-bold uppercase tracking-wider">{col.label}</TableHead>
                        ))}
                        <TableHead className="text-right w-[100px] text-xs font-bold uppercase tracking-wider">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={config.columns.length + 2} className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></TableCell></TableRow>
                    ) : paginatedData.length === 0 ? (
                        <TableRow><TableCell colSpan={config.columns.length + 2} className="text-center py-12 text-slate-500 italic bg-slate-50/30">Data tidak ditemukan.</TableCell></TableRow>
                    ) : (
                        paginatedData.map((item, idx) => (
                            <TableRow key={idx} className="hover:bg-blue-50/50 transition-colors">
                                <TableCell className="font-mono text-xs text-slate-500">{item[config.primaryKey]}</TableCell>
                                {config.columns.map(col => (
                                    <TableCell key={col.key} className="font-medium text-slate-700">
                                        {col.type === 'relation' ? (
                                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                {getRelationLabel(col.key, item[col.key])}
                                            </span>
                                        ) : item[col.key]}
                                    </TableCell>
                                ))}
                                <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)}><Pencil className="w-3.5 h-3.5"/></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(item[config.primaryKey])}><Trash2 className="w-3.5 h-3.5"/></Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* NAVIGASI PAGINATION */}
            {!loading && filteredData.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t bg-slate-50/30">
                    <div className="text-xs text-slate-500">
                        Menampilkan <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> dari <span className="font-medium">{filteredData.length}</span> data
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1}
                            className="h-8 bg-white"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1"/> Sebelumnnya
                        </Button>
                        <div className="flex items-center px-3 text-xs font-medium border rounded bg-white">
                            Halaman {currentPage} dari {totalPages || 1}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 bg-white"
                        >
                            Selanjutnya <ChevronRight className="w-4 h-4 ml-1"/>
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      {/* DIALOG CREATE/EDIT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{editingId ? `Edit Data` : `Tambah Data Baru`}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                {config.columns.map((col) => (
                    <div key={col.key} className="space-y-2">
                        <Label>{col.label}</Label>
                        {col.type === 'relation' ? (
                            <Select value={String(formData[col.key] || "")} onValueChange={(val) => setFormData({...formData, [col.key]: val})}>
                                <SelectTrigger><SelectValue placeholder={`Pilih ${col.label}`} /></SelectTrigger>
                                <SelectContent>
                                    {(relationsData[col.key] || []).map((relItem: any) => (
                                        <SelectItem key={relItem[col.relationKey!]} value={String(relItem[col.relationKey!])}>
                                            {relItem[col.relationLabel!]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={formData[col.key] || ""}
                                onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                                placeholder={`Masukkan ${col.label}`}
                            />
                        )}
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSave} disabled={isSubmitting} className="bg-blue-600">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Simpan
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}