import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface FormLitmasProps {
  editingLitmas: any;
  refJenisLitmas: any[];
  refUpt: any[];
  refBapas: any[];
  selectedJenisLitmas: string;
  setSelectedJenisLitmas: (val: string) => void;
  selectedUpt: string;
  setSelectedUpt: (val: string) => void;
  selectedBapas: string;
  setSelectedBapas: (val: string) => void;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
  SearchableSelect: any; 
}

export const FormLitmas: React.FC<FormLitmasProps> = ({
  editingLitmas, refJenisLitmas, refUpt, refBapas, selectedJenisLitmas, setSelectedJenisLitmas,
  selectedUpt, setSelectedUpt, selectedBapas, setSelectedBapas, nomorUrutLayanan, setNomorUrutLayanan, SearchableSelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="grid gap-2">
        <Label>Jenis Litmas (Khusus Litmas)</Label>
        <SearchableSelect options={refJenisLitmas} value={selectedJenisLitmas} onSelect={setSelectedJenisLitmas} labelKey="jenis" valueKey="jenis" placeholder="Pilih Jenis..." searchPlaceholder="Cari jenis..." name="jenis_litmas" />
      </div>
      <div className="grid gap-2">
        <Label>Asal UPT</Label>
        <SearchableSelect options={refUpt} value={selectedUpt} onSelect={setSelectedUpt} labelKey="nama_upt" valueKey="id_upt" placeholder="Pilih UPT..." searchPlaceholder="Cari UPT..." name="id_upt" />
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

      <div className="grid gap-2">
        <Label>Asal Bapas</Label>
        <SearchableSelect options={refBapas} value={selectedBapas} onSelect={setSelectedBapas} labelKey="nama_bapas" valueKey="nama_bapas" placeholder="Pilih Bapas..." searchPlaceholder="Cari Bapas..." name="asal_bapas" />
      </div>
      <div className="grid gap-2"><Label>Tanggal Registrasi</Label><Input name="tanggal_registrasi" type="date" defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]} /></div>
      <div className="grid gap-2"><Label>Nomor Register Litmas</Label><Input name="nomor_register_litmas" defaultValue={editingLitmas?.nomor_register_litmas || ''} placeholder="Reg. Bapas..." /></div>
      <div className="col-span-2"><Separator className="my-2" /></div>
      <div className="grid gap-2"><Label>No. Surat Permintaan</Label><Input name="nomor_surat_permintaan" defaultValue={editingLitmas?.nomor_surat_permintaan || ''} required /></div>
      <div className="grid gap-2"><Label>Tgl Surat Permintaan</Label><Input name="tanggal_surat_permintaan" type="date" defaultValue={editingLitmas?.tanggal_surat_permintaan || ''} required /></div>
      <div className="grid gap-2"><Label>No. Surat Pelimpahan</Label><Input name="nomor_surat_pelimpahan" defaultValue={editingLitmas?.nomor_surat_pelimpahan || ''} /></div>
      <div className="grid gap-2"><Label>Tgl Surat Pelimpahan</Label><Input name="tanggal_surat_pelimpahan" type="date" defaultValue={editingLitmas?.tanggal_surat_pelimpahan || ''} /></div>
      <div className="grid gap-2"><Label>Tgl Diterima Bapas</Label><Input name="tanggal_diterima_bapas" type="date" defaultValue={editingLitmas?.tanggal_diterima_bapas || ''} required /></div>
      <div className="grid gap-2"><Label>No. Agenda Masuk</Label><Input name="nomor_surat_masuk" defaultValue={editingLitmas?.nomor_surat_masuk || ''} /></div>
    </div>
  );
};