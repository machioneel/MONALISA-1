import { supabase } from '@/integrations/supabase/client';

const getLocalYYYYMMDD = (year: number, monthIndex: number, day: number) => {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

// 1. Dijalankan saat PK Mendaftarkan Klien
export const autoRegisterPerintis = async (idKlien: number, tanggalRegistrasi: string, namaPk: string) => {
  try {
    const regParts = tanggalRegistrasi.split('-');
    const regYear = parseInt(regParts[0], 10);
    const regMonth = parseInt(regParts[1], 10) - 1; 

    let targetYear = regYear;
    let targetMonth = regMonth + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }

    const targetMonthStart = getLocalYYYYMMDD(targetYear, targetMonth, 1);
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const targetMonthEnd = getLocalYYYYMMDD(targetYear, targetMonth, lastDayOfTargetMonth);

    const db: any = supabase;

    const { data: jadwalList, error } = await db
      .from('jadwal_bimbingan')
      .select('id')
      .eq('jenis_kegiatan', 'Perintis')
      .gte('tanggal_mulai', targetMonthStart)
      .lte('tanggal_mulai', targetMonthEnd);

    if (error || !jadwalList || jadwalList.length === 0) return;

    for (const jadwal of jadwalList) {
      // CEK DUPLIKAT: Pastikan klien belum ada di jadwal ini
      const { data: existingPeserta } = await db
        .from('peserta_bimbingan')
        .select('id')
        .eq('id_jadwal', jadwal.id)
        .eq('id_klien', idKlien)
        .maybeSingle();

      if (existingPeserta) continue; // Lewati jika sudah terdaftar

      const { error: insertErr } = await db.from('peserta_bimbingan').insert({
        id_jadwal: jadwal.id,
        id_klien: idKlien,
        is_auto: true,
        absensi: []
      });

      if (insertErr) console.error("Gagal auto-register ke jadwal:", insertErr.message);
    }
  } catch (error) {
    console.error("Gagal menjalankan autoRegisterPerintis:", error);
  }
};

// 2. Dijalankan saat Bimkemas Membuat Jadwal / Menekan Tombol Sync
export const syncPesertaPerintisBatch = async (idJadwal: string, tanggalMulaiJadwal: string) => {
  try {
    const jadwalParts = tanggalMulaiJadwal.split('-');
    const jadwalYear = parseInt(jadwalParts[0], 10);
    const jadwalMonth = parseInt(jadwalParts[1], 10) - 1; 

    let prevYear = jadwalYear;
    let prevMonth = jadwalMonth - 1;
    if (prevMonth < 0) { 
      prevMonth = 11;
      prevYear--;
    }

    const prevMonthStart = getLocalYYYYMMDD(prevYear, prevMonth, 1);
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const prevMonthEnd = getLocalYYYYMMDD(prevYear, prevMonth, lastDayOfPrevMonth);

    const db: any = supabase;

    const { data: klienList, error: klienErr } = await db
      .from('pembimbingan')
      .select('id_klien')
      .gte('tanggal_registrasi', prevMonthStart)
      .lte('tanggal_registrasi', prevMonthEnd);

    if (klienErr || !klienList || klienList.length === 0) return;

    // CEK DUPLIKAT BATCH: Ambil daftar peserta yang sudah ada di jadwal ini
    const { data: existingData } = await db
      .from('peserta_bimbingan')
      .select('id_klien')
      .eq('id_jadwal', idJadwal);

    const existingKlienIds = existingData?.map((p: any) => p.id_klien) || [];

    // Filter hanya klien yang BELUM terdaftar
    const newKlienList = klienList.filter((k: any) => !existingKlienIds.includes(k.id_klien));

    if (newKlienList.length === 0) return; // Hentikan jika semua sudah masuk

    for (const k of newKlienList) {
      const { error: insertErr } = await db.from('peserta_bimbingan').insert({
        id_jadwal: idJadwal,
        id_klien: k.id_klien,
        is_auto: true,
        absensi: []
      });

      if (insertErr) console.error("Gagal batch sync peserta:", insertErr.message);
    }
  } catch (error) {
    console.error("Gagal menjalankan syncPesertaPerintisBatch:", error);
  }
};