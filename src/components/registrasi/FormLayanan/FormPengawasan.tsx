import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormPengawasanProps {
  editingLitmas: any;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
}

export const FormPengawasan: React.FC<FormPengawasanProps> = ({
  editingLitmas, nomorUrutLayanan, setNomorUrutLayanan,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
      <div className="grid gap-2 col-span-2">
         <h4 className="font-bold text-purple-800 mb-2">Form Khusus Pengawasan</h4>
         <p className="text-xs text-purple-600 mb-4">Pengawasan biasanya terkait pelimpahan atau pengawasan khusus dari Kejaksaan/Pengadilan.</p>
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

      <div className="grid gap-2"><Label>Tanggal Registrasi Pengawasan</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
      <div className="grid gap-2"><Label>Nomor Register Pengawasan</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Pengawasan..." /></div>
      <div className="grid gap-2"><Label>Instansi Pengawas Asal (Jika Ada)</Label><Input name="asal_bapas" defaultValue={editingLitmas?.asal_bapas || ''} placeholder="Kejaksaan Negeri..." /></div>
      <div className="grid gap-2"><Label>No. Surat Pengawasan/Pelimpahan</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required /></div>
      <div className="grid gap-2"><Label>Tgl Surat Dikeluarkan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
    </div>
  );
};