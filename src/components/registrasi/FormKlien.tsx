// src/components/registrasi/FormKlien.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, XCircle, AlertTriangle, User, CalendarDays, Plus, Trash2, Globe, AlertCircle, Gavel, Activity, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormKlienProps {
  state: any;
  handlers: any;
  components: any;
}

export const FormKlien: React.FC<FormKlienProps> = ({ state, handlers, components }) => {
  const { SearchableSelect, SuggestionList } = components;
  
  return (
    <Card className={cn("border-t-4 shadow-sm", state.editingKlien ? "border-t-amber-500 bg-amber-50/30" : "border-t-slate-800")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Identitas Klien</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlers.setOpenRiwayatKlien(true)} className="text-blue-600 bg-white">
                <History className="w-4 h-4 mr-2" /> Riwayat Perubahan
            </Button>
            {state.editingKlien && <Button variant="outline" size="sm" onClick={() => handlers.handleCancelButton(true)}><XCircle className="w-4 h-4 mr-2" /> Batal</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form key={state.editingKlien ? state.editingKlien.id_klien : 'klien-new'} onSubmit={handlers.initiateSaveKlien} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2" /> Data Diri Utama</h4>
              
              <div className="grid gap-2">
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input name="nama_klien" defaultValue={state.editingKlien?.nama_klien || ''} required placeholder="Nama Klien" 
                    onChange={(e) => handlers.checkLiveDuplicate('klien', 'nama_klien', e.target.value)} onFocus={() => handlers.setActiveInput('nama_klien')} onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)} autoComplete="off"
                    className={cn(state.matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                  />
                  {state.matchesKlien.length > 0 && (
                    <TooltipProvider>
                      <Tooltip><TooltipTrigger asChild><div className="absolute right-3 top-2.5 text-orange-500 animate-pulse cursor-help"><AlertCircle className="w-5 h-5" /></div></TooltipTrigger><TooltipContent side="right" className="bg-orange-500 text-white border-0"><p>Data mirip ditemukan!</p></TooltipContent></Tooltip>
                    </TooltipProvider>
                  )}
                  <SuggestionList matches={state.matchesKlien} isVisible={state.activeInput === 'nama_klien'} labelField="nama_klien" subLabelField="nik_klien" onSelect={(item: any) => { handlers.handleEditClick(item); handlers.setMatchesKlien([]); }} />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 border rounded-md">
                  <Label className="text-slate-600 text-xs uppercase font-bold">Nama Alias (Julukan)</Label>
                  {state.namaAlias.map((alias: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                          <Input value={alias} onChange={(e) => handlers.handleAliasChange(e.target.value, idx)} placeholder="Contoh: Budi Keren" className="bg-white h-9" />
                          {idx === state.namaAlias.length - 1 ? (
                              <Button type="button" onClick={handlers.handleAddAlias} variant="outline" size="icon" className="h-9 w-9 bg-white"><Plus className="w-4 h-4"/></Button>
                          ) : (
                              <Button type="button" onClick={() => handlers.handleRemoveAlias(idx)} variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></Button>
                          )}
                      </div>
                  ))}
              </div>

              <div className="grid gap-2">
                <Label>NIK Klien <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input name="nik_klien" required defaultValue={state.editingKlien?.nik_klien || ''} placeholder="Nomor Induk Kependudukan" 
                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; handlers.checkLiveDuplicate('klien', 'nik_klien', val); }}
                    onFocus={() => handlers.setActiveInput('nik_klien')} onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric"
                    className={cn(state.matchesKlien.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")}
                  />
                  {state.matchesKlien.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                  <SuggestionList matches={state.matchesKlien} isVisible={state.activeInput === 'nik_klien'} labelField="nik_klien" subLabelField="nama_klien" onSelect={(item: any) => { handlers.handleEditClick(item); handlers.setMatchesKlien([]); }} />
                </div>
              </div>

              <div className="grid gap-2"><Label>No. Register Klien <span className="text-red-500">*</span></Label><Input name="nomor_register_klien" defaultValue={state.editingKlien?.nomor_register_lapas || ''} required placeholder="Menggantikan No. Register Lapas" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Jenis Kelamin <span className="text-red-500">*</span></Label><Select name="jenis_kelamin" required defaultValue={state.editingKlien?.jenis_kelamin || undefined}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2">
                  <Label>Agama<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refAgama} value={state.selectedAgama} onSelect={handlers.setSelectedAgama} labelKey="nama_agama" valueKey="nama_agama" placeholder="Pilih Agama..." searchPlaceholder="Cari agama..." name="agama" allowClear={true}/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 border rounded-md">
                  <div className="grid gap-2">
                      <Label className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-500"/> Kewarganegaraan</Label>
                      <Select value={state.kewarganegaraan} onValueChange={handlers.setKewarganegaraan}>
                          <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                          <SelectContent><SelectItem value="WNI">WNI (Indonesia)</SelectItem><SelectItem value="WNA">WNA (Asing)</SelectItem></SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2">
                      <Label className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500"/> Residivis</Label>
                      <Select value={state.residivis} onValueChange={handlers.setResidivis}>
                          <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                          <SelectContent><SelectItem value="Tidak">Tidak</SelectItem><SelectItem value="Ya">Ya</SelectItem></SelectContent>
                      </Select>
                  </div>
              </div>

              <div className="grid gap-2">
                  <Label>Pendidikan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refPendidikan} value={state.selectedPendidikan} onSelect={handlers.setSelectedPendidikan} labelKey="tingkat" valueKey="tingkat" placeholder="Pilih Pendidikan..." searchPlaceholder="Cari pendidikan..." name="pendidikan" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Kelahiran & Usia</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={state.editingKlien?.tempat_lahir || ''} /></div>
                <div className="grid gap-2"><Label>Tanggal Lahir <span className="text-red-500">*</span></Label><Input name="tanggal_lahir" type="date" value={state.tglLahir} onChange={handlers.handleDateChange} required /></div>
              </div>
              
              {state.usiaWarning && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Akses Ditolak</AlertTitle><AlertDescription>{state.usiaWarning}</AlertDescription></Alert>}

              <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md">
                <div className="grid gap-1"><Label className="text-xs text-slate-500">Usia</Label><Input name="usia" value={state.hitungUsia} readOnly className="bg-white" /></div>
                <div className="grid gap-1"><Label className="text-xs text-slate-500">Kategori</Label><Input name="kategori_usia" value={state.isOpAnak ? 'Anak' : (state.isOpDewasa ? 'Dewasa' : state.hitungKategori)} readOnly className="bg-white font-bold" /></div>
              </div>

              <div className="grid gap-2">
                <Label>Status Perkawinan <span className="text-red-500">*</span></Label>
                <Select value={state.statusPerkawinan} onValueChange={handlers.setStatusPerkawinan}>
                    <SelectTrigger><SelectValue placeholder="Pilih Status..." /></SelectTrigger>
                    <SelectContent><SelectItem value="Belum Kawin">Belum Kawin</SelectItem><SelectItem value="Kawin">Kawin</SelectItem><SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem><SelectItem value="Cerai Mati">Cerai Mati</SelectItem></SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                  <Label>Pekerjaan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refPekerjaan} value={state.selectedPekerjaan} onSelect={handlers.setSelectedPekerjaan} labelKey="nama_pekerjaan" valueKey="nama_pekerjaan" placeholder="Pilih Pekerjaan..." searchPlaceholder="Cari pekerjaan..." name="pekerjaan" allowClear={true}/>
              </div>
              <div className="grid gap-2"><Label>Minat / Bakat</Label><Input name="minat_bakat" defaultValue={state.editingKlien?.minat_bakat || ''} /></div>
            </div>
          </div>

          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2"><Label>Alamat Lengkap <span className="text-red-500">*</span></Label><Textarea name="alamat" required defaultValue={state.editingKlien?.alamat || ''} className="h-24" /></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                   <Label>Kelurahan<span className="text-red-500">*</span></Label>
                   <SearchableSelect 
                      options={state.refKelurahan} 
                      value={state.selectedKelurahan} 
                      onSelect={handlers.handleSelectKelurahan} 
                      labelKey="nama_kelurahan" 
                      valueKey="nama_kelurahan" 
                      placeholder="Pilih Kelurahan..." 
                      searchPlaceholder="Cari kelurahan..." 
                      name="kelurahan" 
                   />
                </div>
                <div className="grid gap-2">
                    <Label>Kecamatan (Otomatis) <span className="text-red-500">*</span></Label>
                    <Input name="kecamatan" required value={state.manualKecamatan} readOnly className="bg-slate-100 font-medium text-slate-700" placeholder="Pilih kelurahan dulu..." />
                </div>
              </div>
              <div className="grid gap-2">
                  <Label>Nomor Telepon <span className="text-slate-400 text-xs">(Isi (-) jika tidak ada)</span></Label>
                  <Input 
                    name="nomor_telepon" 
                    defaultValue={state.editingKlien?.nomor_telepon || ''} 
                    onChange={(e) => {
                      // Mengizinkan karakter angka (0-9) dan dash (-)
                      const val = e.target.value.replace(/[^0-9-]/g, '');
                      e.target.value = val;
                      if (handlers.handlePhoneValidation) {
                        handlers.handlePhoneValidation(e);
                      }
                    }} 
                    placeholder="Isi '-' jika tidak ada nomor telepon" 
                  />
              </div>
            </div>
          </div>
          
          {/* --- READ-ONLY: PERKARA & RIWAYAT LAYANAN --- */}
          {state.editingKlien && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-4 bg-slate-50 border rounded-lg">
                  <h4 className="font-bold flex items-center gap-2 mb-3 text-slate-700"><Gavel className="w-4 h-4"/> Informasi Perkara</h4>
                  <p className="text-xs text-slate-500 mb-4 italic">Pembaruan data perkara melalui Tab Layanan.</p>
                  {state.perkaraList.length > 0 ? (
                      <div className="space-y-2">
                          {state.perkaraList.map((p: any, i: number) => (
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
                  {state.editingKlien.litmas && state.editingKlien.litmas.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                          {state.editingKlien.litmas.map((l: any, i: number) => (
                              <div key={i} className="text-sm bg-white p-3 border rounded shadow-sm relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                  <div className="flex justify-between items-center mb-2">
                                      <Badge className={l.status === 'Ditolak' || l.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>{l.kategori_layanan || 'Litmas'}</Badge>
                                      <span className="text-[10px] text-slate-500">{l.tanggal_registrasi}</span>
                                  </div>
                                  <div className="font-medium text-slate-800 text-xs mb-1">{l.jenis_litmas}</div>
                                  <div className="text-[10px] text-slate-500 bg-slate-50 border px-2 py-1 rounded inline-block">
                                    Tahap: <span className="font-semibold text-slate-700">{l.tahapan_layanan || '-'}</span> | Status: <strong className={l.status === 'Ditolak' ? 'text-red-600' : ''}>{l.status || 'Berjalan'}</strong>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : <p className="text-sm italic text-slate-400">Belum ada riwayat layanan.</p>}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 gap-2">
            <Button type="submit" size="lg" className={cn("w-full md:w-auto", state.editingKlien ? "bg-amber-600 hover:bg-amber-700" : "")} disabled={state.loading || state.isCategoryMismatch}>
              {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (state.editingKlien ? "Simpan Perubahan Klien" : "Simpan & Lanjut ke Penjamin")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};