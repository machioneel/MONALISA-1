// src/components/registrasi/FormPengawasan.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye, Hash, CalendarDays, Mail,
  Building2, ShieldCheck, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Primitives ─────────────────────────────────────────────── */
const SectionHeading = ({
  icon: Icon, label, accent = 'blue',
}: {
  icon: React.ElementType; label: string;
  accent?: 'blue' | 'amber' | 'slate' | 'emerald' | 'rose' | 'green' | 'indigo' | 'violet';
}) => {
  const accentMap: Record<string, string> = {
    blue:    'border-blue-600   text-blue-700   bg-blue-50',
    amber:   'border-amber-500  text-amber-700  bg-amber-50',
    slate:   'border-slate-500  text-slate-700  bg-slate-50',
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    rose:    'border-rose-500   text-rose-700   bg-rose-50',
    green:   'border-green-600  text-green-700  bg-green-50',
    indigo:  'border-indigo-500 text-indigo-700 bg-indigo-50',
    violet:  'border-violet-500 text-violet-700 bg-violet-50',
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
interface FormPengawasanProps {
  editingLitmas: any;
  nomorUrutLayanan: string;
  setNomorUrutLayanan: (val: string) => void;
}

/* ─── Komponen Utama ──────────────────────────────────────────── */
export const FormPengawasan: React.FC<FormPengawasanProps> = ({
  editingLitmas, nomorUrutLayanan, setNomorUrutLayanan,
}) => {
  const isEdit = Boolean(editingLitmas);

  return (
    <Card className={cn(
      'border-0 shadow-md overflow-hidden',
      isEdit ? 'ring-2 ring-violet-400 ring-offset-2' : 'ring-1 ring-slate-200'
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <CardHeader className={cn(
        'px-6 py-4 border-b',
        isEdit
          ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
          : 'bg-gradient-to-r from-violet-700 to-violet-600'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', isEdit ? 'bg-violet-100' : 'bg-white/10')}>
            <Eye className={cn('w-5 h-5', isEdit ? 'text-violet-600' : 'text-white')} />
          </div>
          <div>
            <p className={cn('text-[10px] font-bold uppercase tracking-widest', isEdit ? 'text-violet-600' : 'text-violet-100')}>
              {isEdit ? '✏️ Mode Edit Aktif' : 'Formulir Registrasi'}
            </p>
            <h2 className={cn('text-base font-bold leading-tight', isEdit ? 'text-violet-900' : 'text-white')}>
              Data Pengawasan
            </h2>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-slate-50/60">
        <div className="space-y-5">

          {/* ── Info Banner ──────────────────────────────────── */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-violet-100 bg-violet-50/50">
            <Info className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Pengawasan biasanya terkait pelimpahan atau pengawasan khusus dari Kejaksaan / Pengadilan.
            </p>
          </div>

          {/* ══ Baris 1: Identifikasi ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel>
              <SectionHeading icon={Hash} label="Identifikasi Pengawasan" accent="violet" />
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
                  <Field label="Tgl Registrasi Pengawasan" required>
                    <Input
                      name="tanggal_registrasi"
                      type="date"
                      defaultValue={editingLitmas?.tanggal_registrasi || new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
                    />
                  </Field>
                </div>
                <Field label="Nomor Register Pengawasan">
                  <Input
                    name="nomor_register_litmas"
                    defaultValue={editingLitmas?.nomor_register_litmas || ''}
                    placeholder="Reg. Pengawasan..."
                    className="h-9 text-sm"
                  />
                </Field>
              </div>
            </Panel>

            <Panel>
              <SectionHeading icon={Building2} label="Instansi Pengawas" accent="slate" />
              <Field label="Instansi Pengawas Asal" hint="(jika ada)">
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    name="asal_bapas"
                    defaultValue={editingLitmas?.asal_bapas || ''}
                    placeholder="Kejaksaan Negeri..."
                    className="h-9 text-sm pl-8"
                  />
                </div>
              </Field>
            </Panel>
          </div>

          {/* ══ Baris 2: Surat Pengawasan & Info ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Panel className="lg:col-span-10">
              <SectionHeading icon={Mail} label="Surat Pengawasan / Pelimpahan" accent="amber" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="No. Surat Pengawasan / Pelimpahan" required>
                  <Input
                    name="nomor_surat_permintaan"
                    defaultValue={editingLitmas?.nomor_surat_permintaan || ''}
                    placeholder="Nomor surat..."
                    className="h-9 text-sm"
                  />
                </Field>
                <Field label="Tgl Surat Dikeluarkan" required>
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      name="tanggal_surat_permintaan"
                      type="date"
                      defaultValue={editingLitmas?.tanggal_surat_permintaan || ''}
                      className="h-9 text-sm pl-8"
                    />
                  </div>
                </Field>
              </div>
            </Panel>

            <div className="lg:col-span-2 flex items-stretch">
              <div className="w-full rounded-xl border border-violet-100 bg-violet-50/50 p-4 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                  <span className="text-xs font-bold text-violet-800">Catatan</span>
                </div>
                <p className="text-[11px] text-violet-700 leading-relaxed">
                  Pastikan nomor surat sesuai dokumen resmi dari instansi berwenang.
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