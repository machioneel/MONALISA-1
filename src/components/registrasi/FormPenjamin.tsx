// src/components/registrasi/FormPenjamin.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface FormPenjaminProps {
  state: any;
  handlers: any;
  components: any;
}

export const FormPenjamin: React.FC<FormPenjaminProps> = ({ state, handlers, components }) => {
  const { toast } = useToast();
  const { SearchableSelect, SuggestionList, ClientSelector } = components;

  return (
    <Card className="border-t-4 border-t-green-600 shadow-sm">
      <CardHeader><CardTitle>Data Penjamin</CardTitle><CardDescription>Informasi keluarga.</CardDescription></CardHeader>
      <CardContent>
        <form key={state.editingPenjamin ? `penjamin-${state.editingPenjamin.id_klien}` : 'penjamin-new'} onSubmit={handlers.initiateSavePenjamin} className="space-y-6 mx-auto">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <ClientSelector 
              listKlien={state.listKlien} 
              selectedClientId={state.selectedClientId} 
              setSelectedClientId={handlers.setSelectedClientId} 
              editingKlien={state.editingKlien} 
              handleCancelButton={handlers.handleCancelButton} 
              loading={state.loading} 
              userRoleCategory={state.userRoleCategory} 
            />
          </div>
          <div className={cn("space-y-6", !state.selectedClientId && "opacity-50 pointer-events-none")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label>Nama Penjamin <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input name="nama_penjamin" defaultValue={state.editingPenjamin?.nama_penjamin || ''} required onChange={(e) => handlers.checkLiveDuplicate('penjamin', 'nama_penjamin', e.target.value)} onFocus={() => handlers.setActiveInput('nama_penjamin')} onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)} autoComplete="off" className={cn(state.matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                  {state.matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                  <SuggestionList matches={state.matchesPenjamin} isVisible={state.activeInput === 'nama_penjamin'} labelField="nama_penjamin" subLabelField="nik_penjamin" onSelect={(item: any) => { toast({ title: "Info", description: `Penjamin ${item.nama_penjamin} sudah ada.` }); handlers.setMatchesPenjamin([]); }} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>NIK Penjamin <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input name="nik_penjamin" defaultValue={state.editingPenjamin?.nik_penjamin || ''} placeholder="Wajib Diisi" required onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); e.target.value = val; handlers.checkLiveDuplicate('penjamin', 'nik_penjamin', val); }} onFocus={() => handlers.setActiveInput('nik_penjamin')} onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)} maxLength={16} autoComplete="off" inputMode="numeric" className={cn(state.matchesPenjamin.length > 0 && "pr-10 border-orange-300 ring-orange-200 focus-visible:ring-orange-300")} />
                  {state.matchesPenjamin.length > 0 && <div className="absolute right-3 top-2.5 text-orange-500 animate-pulse"><AlertCircle className="w-5 h-5" /></div>}
                  <SuggestionList matches={state.matchesPenjamin} isVisible={state.activeInput === 'nik_penjamin'} labelField="nik_penjamin" subLabelField="nama_penjamin" onSelect={(item: any) => { toast({ title: "Info", description: `NIK ${item.nik_penjamin} sudah terdaftar.` }); handlers.setMatchesPenjamin([]); }} />
                </div>
              </div>
              <div className="grid gap-2">
                  <Label>Hubungan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refHubungan} value={state.selectedHubungan} onSelect={handlers.setSelectedHubungan} labelKey="nama_hubungan" valueKey="nama_hubungan" placeholder="Pilih Hubungan..." searchPlaceholder="Cari hubungan..." name="hubungan_klien" allowClear={true}/>
              </div>
              <div className="grid gap-2">
                  <Label>Agama<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refAgama} value={state.selectedAgamaPenjamin} onSelect={handlers.setSelectedAgamaPenjamin} labelKey="nama_agama" valueKey="nama_agama" placeholder="Pilih Agama..." searchPlaceholder="Cari agama..." name="agama" allowClear={true}/>
              </div>
              <div className="grid gap-2"><Label>Tempat Lahir <span className="text-red-500">*</span></Label><Input name="tempat_lahir" required defaultValue={state.editingPenjamin?.tempat_lahir || ''} /></div>
              
              <div className="grid gap-2">
                  <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
                  <Input name="tanggal_lahir" type="date" value={state.penjaminTglLahir} required onChange={handlers.handlePenjaminDateChange} />
              </div>
              <div className="grid gap-2">
                  <Label>Usia</Label>
                  <Input name="usia" type="number" className="w-24 bg-slate-100" value={state.penjaminUsia} readOnly placeholder="Auto" />
              </div>

              <div className="grid gap-2">
                  <Label>Pendidikan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refPendidikan} value={state.selectedPendidikanPenjamin} onSelect={handlers.setSelectedPendidikanPenjamin} labelKey="tingkat" valueKey="tingkat" placeholder="Pilih Pendidikan..." searchPlaceholder="Cari pendidikan..." name="pendidikan" />
              </div>
              <div className="grid gap-2">
                  <Label>Pekerjaan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refPekerjaan} value={state.selectedPekerjaanPenjamin} onSelect={handlers.setSelectedPekerjaanPenjamin} labelKey="nama_pekerjaan" valueKey="nama_pekerjaan" placeholder="Pilih Pekerjaan..." searchPlaceholder="Cari pekerjaan..." name="pekerjaan" />
              </div>
              <div className="grid gap-2"><Label>No. Telepon <span className="text-red-500">*</span></Label><Input name="nomor_telepon" type="tel" defaultValue={state.editingPenjamin?.nomor_telepon || ''} required onChange={handlers.handlePhoneValidation} placeholder="Contoh: 08123456789" /></div>
              <div className="grid gap-2 col-span-2"><Label>Alamat <span className="text-red-500">*</span></Label><Textarea name="alamat" required defaultValue={state.editingPenjamin?.alamat || ''} /></div>
              
              <div className="grid gap-2">
                  <Label>Kelurahan<span className="text-red-500">*</span></Label>
                  <SearchableSelect options={state.refKelurahan} value={state.selectedKelurahanPenjamin} onSelect={handlers.handleSelectKelurahanPenjamin} labelKey="nama_kelurahan" valueKey="nama_kelurahan" placeholder="Pilih Kelurahan..." searchPlaceholder="Cari kelurahan..." name="kelurahan" />
              </div>
              <div className="grid gap-2">
                  <Label>Kecamatan (Otomatis) <span className="text-red-500">*</span></Label>
                  <Input name="kecamatan" required value={state.manualKecamatanPenjamin} readOnly className="bg-slate-100 font-medium text-slate-700" placeholder="Pilih kelurahan dulu..." />
              </div>
            </div>
            <div className="flex justify-end pt-4"><Button type="submit" className="bg-green-600 hover:bg-green-700">{state.loading ? <Loader2 className="animate-spin"/> : "Simpan Penjamin"}</Button></div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};