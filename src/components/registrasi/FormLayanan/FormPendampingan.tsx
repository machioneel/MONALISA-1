import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface FormPendampinganProps {
  editingLitmas: any;
  refUpt: any[];
  selectedUpt: string;
  setSelectedUpt: (val: string) => void;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
  SearchableSelect: any;
}

export const FormPendampingan: React.FC<FormPendampinganProps> = ({
  editingLitmas, refUpt, selectedUpt, setSelectedUpt, nomorUrutLayanan, setNomorUrutLayanan, SearchableSelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
      <div className="grid gap-2 col-span-2">
         <h4 className="font-bold text-blue-800 mb-2">Form Khusus Pendampingan</h4>
      </div>
      <div className="grid gap-2">
        <Label>Instansi Peminta / Asal UPT</Label>
        <SearchableSelect options={refUpt} value={selectedUpt} onSelect={setSelectedUpt} labelKey="nama_upt" valueKey="id_upt" placeholder="Pilih Instansi..." searchPlaceholder="Cari Instansi..." name="id_upt" />
      </div>

      <div className="grid gap-2">
        <Label>Nomor Urut</Label>
        <Input
          name="nomor_urut"
          value={nomorUrutLayanan}
          onChange={(e) => setNomorUrutLayanan(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={() => setNomorUrutLayanan(nomorUrutLayanan ? nomorUrutLayanan.padStart(4, '0') : '')}
          placeholder="0001"
        />
      </div>

      <div className="grid gap-2"><Label>Tanggal Registrasi</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
      <div className="grid gap-2"><Label>Nomor Register Pendampingan</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Pendampingan..." /></div>
      <div className="col-span-2"><Separator className="my-2" /></div>
      <div className="grid gap-2"><Label>No. Surat Permintaan Pendampingan</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required /></div>
      <div className="grid gap-2"><Label>Tgl Surat Permintaan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
      <div className="grid gap-2"><Label>Tgl Diterima Bapas</Label><Input name="tanggal_diterima_bapas" type="date" defaultValue={editingLitmas?.tanggal_diterima_bapas || ''} required /></div>
    </div>
  );
};