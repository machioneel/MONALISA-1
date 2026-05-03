// src/components/registrasi/FormKlien.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2, XCircle, AlertTriangle, Plus, Trash2,
  AlertCircle, Gavel, Activity, History,
  UserCircle2, MapPin, Phone, BookOpen, Briefcase,
  ShieldCheck, Globe, Save, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormKlienProps {
  state: any;
  handlers: any;
  components: any;
}

/* ─── Reusable primitives ─────────────────────────────────────── */

/** Label seksi dengan garis aksen vertikal */
const SectionHeading = ({
  icon: Icon,
  label,
  accent = 'blue',
}: {
  icon: React.ElementType;
  label: string;
  accent?: 'blue' | 'amber' | 'slate' | 'emerald' | 'rose';
}) => {
  const accentMap = {
    blue:    'border-blue-600  text-blue-700  bg-blue-50',
    amber:   'border-amber-500 text-amber-700 bg-amber-50',
    slate:   'border-slate-500 text-slate-700 bg-slate-50',
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    rose:    'border-rose-500  text-rose-700  bg-rose-50',
  };
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 mb-4',
      accentMap[accent]
    )}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
};

/** Field wrapper — label + konten */
const Field = ({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
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

/** Panel/kartu dalam form */
const Panel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn(
    'rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
    className
  )}>
    {children}
  </div>
);

/* ─── Komponen Utama ──────────────────────────────────────────── */
export const FormKlien: React.FC<FormKlienProps> = ({ state, handlers, components }) => {
  const { SearchableSelect, SuggestionList } = components;
  const isEdit = Boolean(state.editingKlien);

  return (
    <Card className={cn(
      'border-0 shadow-md overflow-hidden',
      isEdit ? 'ring-2 ring-amber-400 ring-offset-2' : 'ring-1 ring-slate-200'
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <CardHeader className={cn(
        'px-6 py-4 border-b',
        isEdit
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          : 'bg-gradient-to-r from-slate-800 to-slate-700'
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              isEdit ? 'bg-amber-100' : 'bg-white/10'
            )}>
              <UserCircle2 className={cn('w-5 h-5', isEdit ? 'text-amber-600' : 'text-white')} />
            </div>
            <div>
              <p className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                isEdit ? 'text-amber-600' : 'text-slate-300'
              )}>
                {isEdit ? '✏️ Mode Edit Aktif' : 'Formulir Registrasi'}
              </p>
              <h2 className={cn(
                'text-base font-bold leading-tight',
                isEdit ? 'text-amber-900' : 'text-white'
              )}>
                Identitas Klien
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlers.setOpenRiwayatKlien(true)}
              className={cn(
                'h-8 gap-1.5 text-xs',
                isEdit
                  ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'border-white/20 text-white bg-white/10 hover:bg-white/20'
              )}
            >
              <History className="w-3.5 h-3.5" />
              Riwayat
            </Button>
            {isEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlers.handleCancelButton(true)}
                className="h-8 gap-1.5 text-xs border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
              >
                <XCircle className="w-3.5 h-3.5" />
                Batal Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-slate-50/60">
        <form
          key={isEdit ? state.editingKlien.id_klien : 'klien-new'}
          onSubmit={handlers.initiateSaveKlien}
          className="space-y-6"
        >
          {/* ══════════════════════════════════════════════════
              BARIS 1 — Identitas Dasar + Kelahiran & Kategori
          ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Panel: Identitas Dasar */}
            <Panel>
              <SectionHeading icon={UserCircle2} label="Identitas Dasar" accent="blue" />

              <div className="space-y-4">
                {/* Nama Lengkap */}
                <Field label="Nama Lengkap" required>
                  <div className="relative">
                    <Input
                      name="nama_klien"
                      defaultValue={state.editingKlien?.nama_klien || ''}
                      required
                      placeholder="Nama sesuai KTP"
                      onChange={(e) => handlers.checkLiveDuplicate('klien', 'nama_klien', e.target.value)}
                      onFocus={() => handlers.setActiveInput('nama_klien')}
                      onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)}
                      autoComplete="off"
                      className={cn(
                        'h-9 text-sm',
                        state.matchesKlien.length > 0
                          ? 'border-orange-400 ring-1 ring-orange-300 pr-9'
                          : ''
                      )}
                    />
                    {state.matchesKlien.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute right-2.5 top-2 text-orange-500 animate-pulse cursor-help">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-orange-500 text-white border-0 text-xs">
                            Data serupa ditemukan!
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <SuggestionList
                      matches={state.matchesKlien}
                      isVisible={state.activeInput === 'nama_klien'}
                      labelField="nama_klien"
                      subLabelField="nik_klien"
                      onSelect={(item: any) => { handlers.handleEditClick(item); handlers.setMatchesKlien([]); }}
                    />
                  </div>
                </Field>

                {/* Nama Alias */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Nama Alias <span className="normal-case font-normal text-slate-400">(julukan)</span>
                  </Label>
                  <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                    {state.namaAlias.map((alias: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={alias}
                          onChange={(e) => handlers.handleAliasChange(e.target.value, idx)}
                          placeholder={`Alias ${idx + 1}`}
                          className="h-8 text-sm bg-white"
                        />
                        {idx === state.namaAlias.length - 1 ? (
                          <Button
                            type="button"
                            onClick={handlers.handleAddAlias}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handlers.handleRemoveAlias(idx)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* NIK */}
                <Field label="NIK" required>
                  <div className="relative">
                    <Input
                      name="nik_klien"
                      required
                      defaultValue={state.editingKlien?.nik_klien || ''}
                      placeholder="16 digit NIK"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = val;
                        handlers.checkLiveDuplicate('klien', 'nik_klien', val);
                      }}
                      onFocus={() => handlers.setActiveInput('nik_klien')}
                      onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)}
                      maxLength={16}
                      autoComplete="off"
                      inputMode="numeric"
                      className={cn(
                        'h-9 text-sm font-mono tracking-wider',
                        state.matchesKlien.length > 0
                          ? 'border-orange-400 ring-1 ring-orange-300 pr-9'
                          : ''
                      )}
                    />
                    {state.matchesKlien.length > 0 && (
                      <div className="absolute right-2.5 top-2 text-orange-500 animate-pulse">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                    <SuggestionList
                      matches={state.matchesKlien}
                      isVisible={state.activeInput === 'nik_klien'}
                      labelField="nik_klien"
                      subLabelField="nama_klien"
                      onSelect={(item: any) => { handlers.handleEditClick(item); handlers.setMatchesKlien([]); }}
                    />
                  </div>
                </Field>

                {/* No. Register */}
                <Field label="No. Register Klien" required>
                  <Input
                    name="nomor_register_klien"
                    defaultValue={state.editingKlien?.nomor_register_lapas || ''}
                    required
                    placeholder="No. Register Lapas / Klien"
                    className="h-9 text-sm font-mono"
                  />
                </Field>

                {/* Jenis Kelamin + Agama */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jenis Kelamin" required>
                    <Select
                      name="jenis_kelamin"
                      required
                      defaultValue={state.editingKlien?.jenis_kelamin || undefined}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Agama" required>
                    <SearchableSelect
                      options={state.refAgama}
                      value={state.selectedAgama}
                      onSelect={handlers.setSelectedAgama}
                      labelKey="nama_agama"
                      valueKey="nama_agama"
                      placeholder="Pilih..."
                      searchPlaceholder="Cari agama..."
                      name="agama"
                      allowClear
                    />
                  </Field>
                </div>

                {/* Pendidikan */}
                <Field label="Pendidikan" required>
                  <SearchableSelect
                    options={state.refPendidikan}
                    value={state.selectedPendidikan}
                    onSelect={handlers.setSelectedPendidikan}
                    labelKey="tingkat"
                    valueKey="tingkat"
                    placeholder="Pilih Pendidikan..."
                    searchPlaceholder="Cari pendidikan..."
                    name="pendidikan"
                  />
                </Field>
              </div>
            </Panel>

            {/* Panel: Kelahiran, Kategori & Status */}
            <div className="space-y-5">
              <Panel>
                <SectionHeading icon={ShieldCheck} label="Kelahiran & Klasifikasi" accent="slate" />

                <div className="space-y-4">
                  {/* Tempat + Tanggal Lahir */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tempat Lahir" required>
                      <Input
                        name="tempat_lahir"
                        defaultValue={state.editingKlien?.tempat_lahir || ''}
                        required
                        placeholder="Kota lahir"
                        className="h-9 text-sm"
                      />
                    </Field>
                    <Field label="Tanggal Lahir" required>
                      <Input
                        name="tanggal_lahir"
                        type="date"
                        value={state.tglLahir}
                        onChange={handlers.handleDateChange}
                        required
                        className="h-9 text-sm"
                      />
                    </Field>
                  </div>

                  {/* Warning mismatch usia */}
                  {state.usiaWarning && (
                    <Alert variant="destructive" className="py-2.5 text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-bold">Akses Ditolak</AlertTitle>
                      <AlertDescription className="text-xs">{state.usiaWarning}</AlertDescription>
                    </Alert>
                  )}

                  {/* Usia + Kategori (readonly display) */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Usia (Otomatis)">
                      <div className={cn(
                        'h-9 flex items-center px-3 rounded-md border text-sm font-bold',
                        state.hitungUsia
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                      )}>
                        {state.hitungUsia ? `${state.hitungUsia} Tahun` : '— Tahun'}
                        <input type="hidden" name="usia" value={state.hitungUsia || ''} />
                      </div>
                    </Field>
                    <Field label="Kategori">
                      <div className={cn(
                        'h-9 flex items-center justify-between px-3 rounded-md border text-sm font-bold',
                        state.isCategoryMismatch
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : state.hitungKategori === 'Anak'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : state.hitungKategori === 'Dewasa'
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                      )}>
                        <span>
                          {state.isOpAnak ? 'Anak'
                            : state.isOpDewasa ? 'Dewasa'
                            : state.hitungKategori || '—'}
                        </span>
                        {state.isCategoryMismatch && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <input
                          type="hidden"
                          name="kategori_usia"
                          value={state.isOpAnak ? 'Anak' : state.isOpDewasa ? 'Dewasa' : state.hitungKategori}
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Kewarganegaraan + Residivis */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kewarganegaraan" required>
                      <Select value={state.kewarganegaraan} onValueChange={handlers.setKewarganegaraan} required>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WNI">
                            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-500" />WNI</span>
                          </SelectItem>
                          <SelectItem value="WNA">
                            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-amber-500" />WNA</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Residivis" required>
                      <Select value={state.residivis} onValueChange={handlers.setResidivis} required>
                        <SelectTrigger className={cn(
                          'h-9 text-sm',
                          state.residivis === 'Ya' ? 'border-red-300 bg-red-50 text-red-700' : ''
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tidak">Tidak</SelectItem>
                          <SelectItem value="Ya">
                            <span className="flex items-center gap-1.5 text-red-600">
                              <AlertTriangle className="w-3.5 h-3.5" />Ya
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Status Perkawinan */}
                  <Field label="Status Perkawinan" required>
                    <Select value={state.statusPerkawinan} onValueChange={handlers.setStatusPerkawinan}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Pilih status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                        <SelectItem value="Kawin">Kawin</SelectItem>
                        <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                        <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Panel>

              {/* Panel: Pekerjaan & Minat */}
              <Panel>
                <SectionHeading icon={Briefcase} label="Pekerjaan & Minat" accent="emerald" />
                <div className="space-y-3">
                  <Field label="Pekerjaan" required>
                    <SearchableSelect
                      options={state.refPekerjaan}
                      value={state.selectedPekerjaan}
                      onSelect={handlers.setSelectedPekerjaan}
                      labelKey="nama_pekerjaan"
                      valueKey="nama_pekerjaan"
                      placeholder="Pilih Pekerjaan..."
                      searchPlaceholder="Cari pekerjaan..."
                      name="pekerjaan"
                      allowClear
                    />
                  </Field>
                  <Field label="Minat / Bakat">
                    <Input
                      name="minat_bakat"
                      defaultValue={state.editingKlien?.minat_bakat || ''}
                      placeholder="Contoh: Musik, Olahraga..."
                      className="h-9 text-sm"
                    />
                  </Field>
                </div>
              </Panel>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              BARIS 2 — Domisili
          ══════════════════════════════════════════════════ */}
          <Panel>
            <SectionHeading icon={MapPin} label="Domisili & Kontak" accent="blue" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Alamat */}
              <Field label="Alamat Lengkap" required className="md:col-span-5">
                <Textarea
                  name="alamat"
                  required
                  defaultValue={state.editingKlien?.alamat || ''}
                  placeholder="Jalan, RT/RW, No. Rumah..."
                  className="h-[88px] text-sm resize-none"
                />
              </Field>

              {/* Kelurahan + Kecamatan */}
              <div className="md:col-span-4 space-y-3">
                <Field label="Kelurahan" required>
                  <SearchableSelect
                    options={state.refKelurahan}
                    value={state.selectedKelurahan}
                    onSelect={handlers.handleSelectKelurahan}
                    labelKey="nama_kelurahan"
                    valueKey="nama_kelurahan"
                    placeholder="Pilih Kelurahan..."
                    searchPlaceholder="Ketik nama kelurahan..."
                    name="kelurahan"
                  />
                </Field>
                <Field label="Kecamatan (Otomatis)" required>
                  <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-600">
                    {state.manualKecamatan || (
                      <span className="text-slate-400 text-xs italic">Pilih kelurahan terlebih dahulu</span>
                    )}
                    <input type="hidden" name="kecamatan" value={state.manualKecamatan || ''} />
                  </div>
                </Field>
              </div>

              {/* Telepon */}
              <Field
                label="Nomor Telepon" required className="md:col-span-3">
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    name="nomor_telepon"
                    required
                    defaultValue={state.editingKlien?.nomor_telepon || ''}
                    onKeyDown={(e) => {
                        // Blokir karakter yang tidak diinginkan (huruf, dll)
                        if (!/[0-9+\-().# ]/.test(e.key) && e.key.length === 1) {
                        e.preventDefault();
                        }
                    }}
                    placeholder="Isi '-' jika tidak ada"
                    className="h-9 text-sm pl-8"
                    />
                </div>
              </Field>
            </div>
          </Panel>

          {/* ══════════════════════════════════════════════════
              BARIS 3 — Perkara & Riwayat (hanya saat edit)
          ══════════════════════════════════════════════════ */}
          {isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Panel Perkara */}
              <Panel>
                <SectionHeading icon={Gavel} label="Informasi Perkara" accent="rose" />
                <p className="text-[11px] text-slate-400 italic -mt-2 mb-3">
                  Pembaruan data perkara melalui Tab Layanan.
                </p>
                {state.perkaraList.length > 0 ? (
                  <div className="space-y-2">
                    {state.perkaraList.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5"
                      >
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 shrink-0 mt-0.5 text-[11px]">
                          Ps. {p.pasal}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{p.tindak_pidana}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Vonis: <span className="font-semibold text-slate-700">{p.vonis_pidana || '-'}</span>
                            {p.tanggal_ekspirasi && (
                              <> · Exp: <span className="font-semibold text-red-600">{p.tanggal_ekspirasi}</span></>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400 py-2">Belum ada data perkara.</p>
                )}
              </Panel>

              {/* Panel Riwayat Layanan */}
              <Panel className="border-blue-100 bg-blue-50/30">
                <SectionHeading icon={Activity} label="Riwayat Layanan Klien" accent="blue" />
                <p className="text-[11px] text-blue-400 italic -mt-2 mb-3">
                  Daftar layanan yang pernah dijalani klien ini.
                </p>
                {state.editingKlien.litmas && state.editingKlien.litmas.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {state.editingKlien.litmas.map((l: any, i: number) => (
                      <div
                        key={i}
                        className="relative overflow-hidden text-sm bg-white border border-blue-100 rounded-lg px-3 py-2.5"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
                        <div className="flex items-center justify-between mb-1.5 pl-1">
                          <Badge className={cn(
                            'text-[11px]',
                            l.status === 'Ditolak' || l.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          )}>
                            {l.kategori_layanan || 'Litmas'}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{l.tanggal_registrasi}</span>
                        </div>
                        <p className="font-semibold text-slate-800 text-xs pl-1 mb-1">{l.jenis_litmas}</p>
                        <div className="flex items-center gap-1.5 pl-1">
                          <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                            {l.tahapan_layanan || '-'}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <span className={cn(
                            'text-[10px] font-bold',
                            l.status === 'Ditolak' ? 'text-red-600' : 'text-slate-500'
                          )}>
                            {l.status || 'Berjalan'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400 py-2">Belum ada riwayat layanan.</p>
                )}
              </Panel>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              FOOTER — Tombol Simpan
          ══════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <p className="text-[11px] text-slate-400">
              <span className="text-red-500">*</span> Field wajib diisi
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={state.loading || state.isCategoryMismatch}
              className={cn(
                'h-10 gap-2 font-semibold shadow-sm',
                state.isCategoryMismatch
                  ? 'bg-red-100 text-red-400 cursor-not-allowed'
                  : isEdit
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              )}
            >
              {state.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {state.loading
                ? 'Menyimpan...'
                : isEdit
                ? 'Simpan Perubahan'
                : 'Simpan & Lanjut ke Penjamin'}
              {!state.loading && !isEdit && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};