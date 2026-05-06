/**
 * Fungsi untuk menghasilkan daftar jadwal Wajib Lapor klien.
 * Aturan: Dilakukan setiap bulan di tanggal yang sama dengan tanggal registrasi,
 * hingga mencapai tanggal pengakhiran.
 * 
 * @param tanggalRegistrasi String tanggal ISO (misal: "2026-05-10")
 * @param tanggalPengakhiran String tanggal ISO (misal: "2027-05-10")
 * @returns Array of strings berisi tanggal jatuh tempo Wajib Lapor (YYYY-MM-DD)
 */
export function generateJadwalWajibLapor(tanggalRegistrasi: string, tanggalPengakhiran: string): string[] {
  const schedules: string[] = [];
  
  if (!tanggalRegistrasi || !tanggalPengakhiran) return schedules;

  const startDate = new Date(tanggalRegistrasi);
  const endDate = new Date(tanggalPengakhiran);

  // Ambil tanggal patokan (misal: registrasi tanggal 10, maka patokan = 10)
  const baseDate = startDate.getDate();

  // Wajib lapor pertama adalah 1 bulan setelah registrasi
  let currentSchedule = new Date(startDate);
  currentSchedule.setMonth(currentSchedule.getMonth() + 1);

  // Loop untuk menambahkan jadwal selama belum melewati tanggal pengakhiran
  while (currentSchedule <= endDate) {
    // Menghindari bug pelompatan bulan untuk tanggal 31 (misal 31 Jan -> 3 Maret)
    // Pastikan tanggalnya sesuai dengan tanggal registrasi, jika melebihi hari di bulan tersebut, gunakan hari terakhir bulan itu.
    const tempDate = new Date(currentSchedule.getFullYear(), currentSchedule.getMonth(), baseDate);
    
    // Jika bulan bergeser karena jumlah hari lebih sedikit (contoh: 31 Feb -> 3 Mar)
    if (tempDate.getMonth() !== currentSchedule.getMonth()) {
        // Set ke hari terakhir di bulan yang seharusnya
        tempDate.setDate(0); 
    }

    // Pastikan tanggal yang digenerate tidak melewati tanggal pengakhiran
    if (tempDate > endDate) break;

    // Masukkan ke array dengan format YYYY-MM-DD
    schedules.push(tempDate.toISOString().split('T')[0]);

    // Lanjut ke bulan berikutnya
    currentSchedule.setMonth(currentSchedule.getMonth() + 1);
  }

  return schedules;
}