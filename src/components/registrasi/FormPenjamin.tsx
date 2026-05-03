// src/components/registrasi/FormPenjamin.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, AlertCircle, Save, ChevronRight,
  UserCheck, MapPin, Phone, Briefcase,
  ShieldCheck, HeartHandshake, CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface FormPenjaminProps {
  state: any;
  handlers: any;
  components: any;
}

/* ─── Reusable primitives (identik dengan FormKlien) ─────────── */

const SectionHeading = ({
  icon: Icon,
  label,
  accent = 'blue',
}: {
  icon: React.ElementType;
  label: string;
  accent?: 'blue' | 'amber' | 'slate' | 'emerald' | 'rose' | 'green';
}) => {
  const accentMap = {
    blue:    'border-blue-600   text-blue-700   bg-blue-50',
    amber:   'border-amber-500  text-amber-700  bg-amber-50',
    slate:   'border-slate-500  text-slate-700  bg-slate-50',
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    rose:    'border-rose-500   text-rose-700   bg-rose-50',
    green:   'border-green-600  text-green-700  bg-green-50',
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
export const FormPenjamin: React.FC<FormPenjaminProps> = ({ state, handlers, components }) => {
  const { toast } = useToast();
  const { SearchableSelect, SuggestionList, ClientSelector } = components;
  const isEdit = Boolean(state.editingPenjamin);

  return (
    <Card className={cn(
      'border-0 shadow-md overflow-hidden',
      isEdit ? 'ring-2 ring-green-400 ring-offset-2' : 'ring-1 ring-slate-200'
    )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <CardHeader className={cn(
        'px-6 py-4 border-b',
        isEdit
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          : 'bg-gradient-to-r from-green-700 to-green-600'
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              isEdit ? 'bg-green-100' : 'bg-white/10'
            )}>
              <UserCheck className={cn('w-5 h-5', isEdit ? 'text-green-600' : 'text-white')} />
            </div>
            <div>
              <p className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                isEdit ? 'text-green-600' : 'text-green-100'
              )}>
                {isEdit ? '✏️ Mode Edit Aktif' : 'Formulir Registrasi'}
              </p>
              <h2 className={cn(
                'text-base font-bold leading-tight',
                isEdit ? 'text-green-900' : 'text-white'
              )}>
                Data Penjamin / Keluarga
              </h2>
            </div>
          </div>

          {/* Badge klien terpilih */}
          {state.editingKlien && (
            <div className={cn(
              'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
              isEdit ? 'bg-green-100 text-green-800' : 'bg-white/10 text-white'
            )}>
              <HeartHandshake className="w-3.5 h-3.5" />
              Penjamin dari: {state.editingKlien.nama_klien}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-slate-50/60">
        <form
          key={isEdit
            ? `penjamin-${state.editingPenjamin?.id_klien}`
            : 'penjamin-new'}
          onSubmit={handlers.initiateSavePenjamin}
          className="space-y-6"
        >
          {/* ── Selector Klien ─────────────────────────────── */}
          <Panel className={cn(
            'border-green-100 bg-green-50/30',
            !state.selectedClientId && 'border-dashed'
          )}>
            <SectionHeading icon={HeartHandshake} label="Klien yang Dijamin" accent="green" />
            <ClientSelector
              listKlien={state.listKlien}
              selectedClientId={state.selectedClientId}
              setSelectedClientId={handlers.setSelectedClientId}
              editingKlien={state.editingKlien}
              handleCancelButton={handlers.handleCancelButton}
              loading={state.loading}
              userRoleCategory={state.userRoleCategory}
            />
            {!state.selectedClientId && (
              <p className="mt-2 text-[11px] text-green-600 italic flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Pilih klien terlebih dahulu untuk mengaktifkan form penjamin.
              </p>
            )}
          </Panel>

          {/* ── Body Form (disabled jika belum pilih klien) ─ */}
          <div className={cn(
            'space-y-5 transition-opacity duration-200',
            !state.selectedClientId && 'opacity-40 pointer-events-none select-none'
          )}>

            {/* ══════════════════════════════════════════════
                BARIS 1 — Identitas + Kelahiran & Hubungan
            ══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Panel: Identitas Penjamin */}
              <Panel>
                <SectionHeading icon={UserCheck} label="Identitas Penjamin" accent="blue" />
                <div className="space-y-4">

                  {/* Nama Penjamin */}
                  <Field label="Nama Penjamin" required>
                    <div className="relative">
                      <Input
                        name="nama_penjamin"
                        defaultValue={state.editingPenjamin?.nama_penjamin || ''}
                        required
                        placeholder="Nama sesuai KTP"
                        onChange={(e) =>
                          handlers.checkLiveDuplicate('penjamin', 'nama_penjamin', e.target.value)
                        }
                        onFocus={() => handlers.setActiveInput('nama_penjamin')}
                        onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)}
                        autoComplete="off"
                        className={cn(
                          'h-9 text-sm',
                          state.matchesPenjamin.length > 0
                            ? 'border-orange-400 ring-1 ring-orange-300 pr-9'
                            : ''
                        )}
                      />
                      {state.matchesPenjamin.length > 0 && (
                        <div className="absolute right-2.5 top-2 text-orange-500 animate-pulse">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                      <SuggestionList
                        matches={state.matchesPenjamin}
                        isVisible={state.activeInput === 'nama_penjamin'}
                        labelField="nama_penjamin"
                        subLabelField="nik_penjamin"
                        onSelect={(item: any) => {
                          toast({ title: "Info", description: `Penjamin ${item.nama_penjamin} sudah ada.` });
                          handlers.setMatchesPenjamin([]);
                        }}
                      />
                    </div>
                  </Field>

                  {/* NIK Penjamin */}
                  <Field label="NIK Penjamin" required>
                    <div className="relative">
                      <Input
                        name="nik_penjamin"
                        defaultValue={state.editingPenjamin?.nik_penjamin || ''}
                        required
                        placeholder="16 digit NIK"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = val;
                          handlers.checkLiveDuplicate('penjamin', 'nik_penjamin', val);
                        }}
                        onFocus={() => handlers.setActiveInput('nik_penjamin')}
                        onBlur={() => setTimeout(() => handlers.setActiveInput(null), 200)}
                        maxLength={16}
                        autoComplete="off"
                        inputMode="numeric"
                        className={cn(
                          'h-9 text-sm font-mono tracking-wider',
                          state.matchesPenjamin.length > 0
                            ? 'border-orange-400 ring-1 ring-orange-300 pr-9'
                            : ''
                        )}
                      />
                      {state.matchesPenjamin.length > 0 && (
                        <div className="absolute right-2.5 top-2 text-orange-500 animate-pulse">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                      <SuggestionList
                        matches={state.matchesPenjamin}
                        isVisible={state.activeInput === 'nik_penjamin'}
                        labelField="nik_penjamin"
                        subLabelField="nama_penjamin"
                        onSelect={(item: any) => {
                          toast({ title: "Info", description: `NIK ${item.nik_penjamin} sudah terdaftar.` });
                          handlers.setMatchesPenjamin([]);
                        }}
                      />
                    </div>
                  </Field>

                  {/* Hubungan + Agama */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hubungan dengan Klien" required>
                      <SearchableSelect
                        options={state.refHubungan}
                        value={state.selectedHubungan}
                        onSelect={handlers.setSelectedHubungan}
                        labelKey="nama_hubungan"
                        valueKey="nama_hubungan"
                        placeholder="Pilih..."
                        searchPlaceholder="Cari hubungan..."
                        name="hubungan_klien"
                        allowClear
                      />
                    </Field>
                    <Field label="Agama" required>
                      <SearchableSelect
                        options={state.refAgama}
                        value={state.selectedAgamaPenjamin}
                        onSelect={handlers.setSelectedAgamaPenjamin}
                        labelKey="nama_agama"
                        valueKey="nama_agama"
                        placeholder="Pilih..."
                        searchPlaceholder="Cari agama..."
                        name="agama"
                        allowClear
                      />
                    </Field>
                  </div>

                  {/* Pendidikan + Pekerjaan */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Pendidikan" required>
                      <SearchableSelect
                        options={state.refPendidikan}
                        value={state.selectedPendidikanPenjamin}
                        onSelect={handlers.setSelectedPendidikanPenjamin}
                        labelKey="tingkat"
                        valueKey="tingkat"
                        placeholder="Pilih..."
                        searchPlaceholder="Cari pendidikan..."
                        name="pendidikan"
                      />
                    </Field>
                    <Field label="Pekerjaan" required>
                      <SearchableSelect
                        options={state.refPekerjaan}
                        value={state.selectedPekerjaanPenjamin}
                        onSelect={handlers.setSelectedPekerjaanPenjamin}
                        labelKey="nama_pekerjaan"
                        valueKey="nama_pekerjaan"
                        placeholder="Pilih..."
                        searchPlaceholder="Cari pekerjaan..."
                        name="pekerjaan"
                      />
                    </Field>
                  </div>
                </div>
              </Panel>

              {/* Panel Kanan: Kelahiran + Kontak */}
              <div className="space-y-5">

                {/* Panel: Kelahiran & Usia */}
                <Panel>
                  <SectionHeading icon={CalendarDays} label="Kelahiran & Usia" accent="slate" />
                  <div className="space-y-4">

                    {/* Tempat + Tanggal Lahir */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tempat Lahir" required>
                        <Input
                          name="tempat_lahir"
                          required
                          defaultValue={state.editingPenjamin?.tempat_lahir || ''}
                          placeholder="Kota lahir"
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field label="Tanggal Lahir" required>
                        <Input
                          name="tanggal_lahir"
                          type="date"
                          value={state.penjaminTglLahir}
                          required
                          onChange={handlers.handlePenjaminDateChange}
                          className="h-9 text-sm"
                        />
                      </Field>
                    </div>

                    {/* Usia (readonly) */}
                    <Field label="Usia (Otomatis)">
                      <div className={cn(
                        'h-9 flex items-center px-3 rounded-md border text-sm font-bold',
                        state.penjaminUsia
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                      )}>
                        {state.penjaminUsia ? `${state.penjaminUsia} Tahun` : '— Tahun'}
                        <input type="hidden" name="usia" value={state.penjaminUsia || ''} />
                      </div>
                    </Field>
                  </div>
                </Panel>

                {/* Panel: Kontak */}
                <Panel>
                  <SectionHeading icon={Phone} label="Kontak" accent="emerald" />
                  <Field
                    label="Nomor Telepon"
                    required
                    hint="(wajib bisa dihubungi)"
                  >
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        name="nomor_telepon"
                        required
                        type="tel"
                        defaultValue={state.editingPenjamin?.nomor_telepon || ''}
                        onChange={handlers.handlePhoneValidation}
                        placeholder="Contoh: 08123456789"
                        className="h-9 text-sm pl-8"
                      />
                    </div>
                  </Field>
                </Panel>
              </div>
            </div>

            {/* ══════════════════════════════════════════════
                BARIS 2 — Domisili
            ══════════════════════════════════════════════ */}
            <Panel>
              <SectionHeading icon={MapPin} label="Domisili" accent="blue" />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* Alamat */}
                <Field label="Alamat Lengkap" required className="md:col-span-5">
                  <Textarea
                    name="alamat"
                    required
                    defaultValue={state.editingPenjamin?.alamat || ''}
                    placeholder="Jalan, RT/RW, No. Rumah..."
                    className="h-[88px] text-sm resize-none"
                  />
                </Field>

                {/* Kelurahan + Kecamatan */}
                <div className="md:col-span-4 space-y-3">
                  <Field label="Kelurahan" required>
                    <SearchableSelect
                      options={state.refKelurahan}
                      value={state.selectedKelurahanPenjamin}
                      onSelect={handlers.handleSelectKelurahanPenjamin}
                      labelKey="nama_kelurahan"
                      valueKey="nama_kelurahan"
                      placeholder="Pilih Kelurahan..."
                      searchPlaceholder="Ketik nama kelurahan..."
                      name="kelurahan"
                    />
                  </Field>
                  <Field label="Kecamatan (Otomatis)" required>
                    <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-600">
                      {state.manualKecamatanPenjamin || (
                        <span className="text-slate-400 text-xs italic">
                          Pilih kelurahan terlebih dahulu
                        </span>
                      )}
                      <input
                        type="hidden"
                        name="kecamatan"
                        value={state.manualKecamatanPenjamin || ''}
                      />
                    </div>
                  </Field>
                </div>

                {/* Info Box */}
                <div className="md:col-span-3 flex items-stretch">
                  <div className="w-full rounded-xl border border-green-100 bg-green-50/50 p-4 flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-xs font-bold text-green-800">Catatan</span>
                    </div>
                    <p className="text-[11px] text-green-700 leading-relaxed">
                      Alamat penjamin digunakan sebagai referensi kontak darurat dalam proses pendampingan klien.
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* ── Footer ───────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <p className="text-[11px] text-slate-400">
                <span className="text-red-500">*</span> Field wajib diisi
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={state.loading || !state.selectedClientId}
                className={cn(
                  'h-10 gap-2 font-semibold shadow-sm',
                  isEdit
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-700 hover:bg-green-800 text-white'
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
                  : 'Simpan & Lanjut ke Layanan'}
                {!state.loading && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};