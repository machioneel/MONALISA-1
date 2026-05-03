// src/components/registrasi/FormPendampingan.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Hash, CalendarDays, Mail,
  ClipboardList, ShieldCheck, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Primitives ─────────────────────────────────────────────── */
const SectionHeading = ({
  icon: Icon, label, accent = 'blue',
}: {
  icon: React.ElementType; label: string;
  accent?: 'blue' | 'amber' | 'slate' | 'emerald' | 'rose' | 'green' | 'indigo' | 'sky';
}) => {
  const accentMap: Record<string, string> = {
    blue:    'border-blue-600   text-blue-700   bg-blue-50',
    amber:   'border-amber-500  text-amber-700  bg-amber-50',
    slate:   'border-slate-500  text-slate-700  bg-slate-50',
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    rose:    'border-rose-500   text-rose-700   bg-rose-50',
    green:   'border-green-600  text-green-700  bg-green-50',
    indigo:  'border-indigo-500 text-indigo-700 bg-indigo-50',
    sky:     'border-sky-500    text-sky-700    bg-sky-50',
  };
  return (
    <div className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 mb-4', accentMap[accent])}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
};

const Field = ({ label, required, hint, children, className }: {
  label: string; required?: boolean; hint?: string;
  children: React.ReactNode; className?: string;
}) => (
  <div className={cn('grid gap-1.5', className)}>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      {hint && <span className="ml-1 normal-case font-normal text-slate-400">{hint}</span>}
    </Label>
    {children}
  </div>
);

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
    {children}
  </div>
);

/* ─── Props ──────────────────────────────────────────────────── */
interface FormPendampinganProps {
  editingLitmas: any;
  refUpt: any[];
  selectedUpt: string;
  setSelectedUpt: (val: string) => void;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
  SearchableSelect: any;
}

/* ─── Komponen Utama ──────────────────────────────────────────── */
export const FormPendampingan: React.FC<FormPendampinganProps> = ({
  editingLitmas, refUpt, selectedUpt, setSelectedUpt,
  nomorUrutLayanan, setNomorUrutLayanan, SearchableSelect,
}) => {
  const isEdit = Boolean(editingLitmas);

  return (
    <Card className={cn(
      'border-0 shadow-md overflow-hidden',
      isEdit ? 'ring-2 ring-sky-400 ring-offset-2' : 'ring-1 ring-slate-200'
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <CardHeader className={cn(
        'px-6 py-4 border-b',
        isEdit
          ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'
          : 'bg-gradient-to-r from-sky-700 to-sky-600'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', isEdit ? 'bg-sky-100' : 'bg-white/10')}>
            <ClipboardList className={cn('w-5 h-5', isEdit ? 'text-sky-600' : 'text-white')} />
          </div>
          <div>
            <p className={cn('text-[10px] font-bold uppercase tracking-widest', isEdit ? 'text-sky-600' : 'text-sky-100')}>
              {isEdit ? '✏️ Mode Edit Aktif' : 'Formulir Registrasi'}
            </p>
            <h2 className={cn('text-base font-bold leading-tight', isEdit ? 'text-sky-900' : 'text-white')}>
              Data Pendampingan
            </h2>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-slate-50/60">
        <div className="space-y-5">

          {/* ══ Baris 1: Instansi & Identifikasi ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <SectionHeading icon={Building2} label="Instansi Peminta" accent="sky" />
              <Field label="Instansi Peminta / Asal UPT" required>
                <SearchableSelect
                  options={refUpt}
                  value={selectedUpt}
                  onSelect={setSelectedUpt}
                  labelKey="nama_upt"
                  valueKey="id_upt"
                  placeholder="Pilih Instansi..."
                  searchPlaceholder="Cari Instansi..."
                  name="id_upt"
                />
              </Field>
            </Panel>

            <Panel>
              <SectionHeading icon={Hash} label="Identifikasi Pendampingan" accent="indigo" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nomor Urut" required>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        name="nomor_urut"
                        value={nomorUrutLayanan}
                        onChange={(e) => setNomorUrutLayanan(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onBlur={() => setNomorUrutLayanan(nomorUrutLayanan ? nomorUrutLayanan.padStart(4, '0') : '')}
                        placeholder="0001"
                        className="h-9 text-sm font-mono tracking-wider pl-8"
                      />
                    </div>
                  </Field>
                  <Field label="Tanggal Registrasi" required>
                    <Input
                      name="tanggal_registrasi"
                      type="date"
                      defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
                    />
                  </Field>
                </div>
                <Field label="Nomor Register Pendampingan">
                  <Input
                    name="nomor_register_litmas"
                    defaultValue={editingLitmas?.nomor_register_litmas || ''}
                    placeholder="Reg. Pendampingan..."
                    className="h-9 text-sm"
                  />
                </Field>
              </div>
            </Panel>
          </div>

          {/* ══ Baris 2: Surat Permintaan & Penerimaan ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Panel className="lg:col-span-5">
              <SectionHeading icon={Mail} label="Surat Permintaan" accent="amber" />
              <div className="space-y-4">
                <Field label="No. Surat Permintaan Pendampingan" required>
                  <Input
                    name="nomor_surat_permintaan"
                    defaultValue={editingLitmas?.nomor_surat_permintaan || ''}
                    placeholder="Nomor surat..."
                    className="h-9 text-sm"
                  />
                </Field>
                <Field label="Tgl Surat Permintaan" required>
                  <Input
                    name="tanggal_surat_permintaan"
                    type="date"
                    defaultValue={editingLitmas?.tanggal_surat_permintaan || ''}
                    className="h-9 text-sm"
                  />
                </Field>
              </div>
            </Panel>

            <Panel className="lg:col-span-5">
              <SectionHeading icon={CalendarDays} label="Penerimaan Bapas" accent="emerald" />
              <Field label="Tgl Diterima Bapas" required>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    name="tanggal_diterima_bapas"
                    type="date"
                    defaultValue={editingLitmas?.tanggal_diterima_bapas || ''}
                    className="h-9 text-sm pl-8"
                  />
                </div>
              </Field>
            </Panel>

            <div className="lg:col-span-2 flex items-stretch">
              <div className="w-full rounded-xl border border-sky-100 bg-sky-50/50 p-4 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-xs font-bold text-sky-800">Catatan</span>
                </div>
                <p className="text-[11px] text-sky-700 leading-relaxed">
                  Surat permintaan harus berasal dari instansi resmi yang tercatat di sistem.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            <span className="text-red-500">*</span> Field wajib diisi
          </p>
        </div>
      </CardContent>
    </Card>
  );
};