import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormPembimbinganProps {
  editingLitmas: any;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
}

export const FormPembimbingan: React.FC<FormPembimbinganProps> = ({
  editingLitmas, nomorUrutLayanan, setNomorUrutLayanan,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50/30 p-4 rounded-xl border border-green-100">
      <div className="grid gap-2 col-span-2">
         <h4 className="font-bold text-green-800 mb-2">Form Khusus Pembimbingan</h4>
      </div>

      <div className="grid gap-2">
        <Label>Program Pembimbingan</Label>
        <Select name="jenis_litmas" defaultValue={editingLitmas?.jenis_litmas || "Pembimbingan Kepribadian"}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Program..." /></SelectTrigger>
            <SelectContent>
                <SelectItem value="Pembimbingan Kepribadian">Pembimbingan Kepribadian</SelectItem>
                <SelectItem value="Pembimbingan Kemandirian">Pembimbingan Kemandirian</SelectItem>
                <SelectItem value="Pembimbingan Campuran">Pembimbingan Campuran</SelectItem>
            </SelectContent>
        </Select>
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

      <div className="grid gap-2"><Label>Tanggal Mulai Bimbingan</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
      <div className="grid gap-2"><Label>Nomor Register Pembimbingan</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Pembimbingan..." /></div>
      <div className="grid gap-2"><Label>No. Surat Keputusan (SK)</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required placeholder="Nomor SK Integrasi..." /></div>
      <div className="grid gap-2"><Label>Tgl SK Dikeluarkan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
    </div>
  );
};