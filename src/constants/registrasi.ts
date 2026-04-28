export const JENIS_LITMAS = [
  "Integrasi PB", 
  "Integrasi CB", 
  "Integrasi CMB", 
  "Asimilasi", 
  "Perawatan Tahanan", 
  "Lainnya"
];

export const TAHAPAN_LAYANAN = [
  "Pra Adjudikasi",
  "Adjudikasi",
  "Pasca Adjudikasi"
];

export const AGAMA_OPTIONS = [
  "Islam", 
  "Kristen", 
  "Katolik", 
  "Hindu", 
  "Buddha", 
  "Konghucu", 
  "Lainnya"
];

export const KEWARGANEGARAAN_OPTIONS = [
  "WNI",
  "WNA"
];

export const PENDIDIKAN_OPTIONS = [
  "Tidak Sekolah", 
  "SD", 
  "SMP", 
  "SMA/SMK", 
  "D3", 
  "S1", 
  "S2", 
  "S3"
];

export const STATUS_PERKAWINAN = [
  "Belum Kawin",
  "Kawin",
  "Cerai Hidup",
  "Cerai Mati"
];

// --- HIERARKI LAYANAN ANAK ---
export const HIERARKI_LAYANAN_ANAK = {
  litmas: {
    "Pra Adjudikasi": [
      "Litmas Anak dibawah 12 Tahun", 
      "Litmas Diversi", 
      "Litmas Sidang", 
      "Litmas Perawatan", 
      "Litmas Penempatan", 
      "Litmas Restorative Justice"
    ],
    "Adjudikasi": [
      "Litmas Sidang", 
      "Litmas Perawatan", 
      "Litmas Penempatan"
    ],
    "Pasca Adjudikasi": [
      "Litmas Pembinaan Awal", 
      "Litmas Pemindahan", 
      "Litmas Program Asimilasi", 
      "Litmas Program CMK", 
      "Litmas Program CDK", 
      "Asimilasi Tempat Tinggal/Rumah Antara", 
      "Litmas Re-integrasi CB", 
      "Litmas Re-integrasi CMB", 
      "Litmas Re-integrasi PB", 
      "Litmas Grasi", 
      "Litmas Program Bimbingan"
    ]
  },

  pendampingan: {
    "Pra Adjudikasi": [
      "Pendampingan Anak dibawah 12 Tahun", 
      "Pendampingan Tingkat Penyidikan (BAP)", 
      "Pendampingan Proses Diversi", 
      "Pendampingan Pelaksanaan Kesepakatan Diversi", 
      "Pendampingan Tingkat Penuntutan (P21)",  
      "Pendampingan Pelaksanaan Kesepakatan Diversi", 
      "Pendampingan Layanan Tahanan"
    ],
    "Adjudikasi": [
      "Pendampingan Tingkat Peeriksaan Perkara di Pengadilan", 
      "Pendampingan Layanan Tahanan dalam Tahap persidangan"
    ],
    "Pasca Adjudikasi": [
      "Pendampingan Putusan Penjara", 
      "Pendampingan Putusan Non-Pemennjaraan", 
      "Pendampingan Klien Menjalani Program Integrasi"
    ] 
  },
  
  pembimbingan: {
    "Pra Adjudikasi": [
      "Bimbingan Pelayanan Tahanan Kota", 
      "Bimbingan Pelayanan Tahanan Rumah", 
      "Bimbingan Klien yang Tidak Ditahan"
    ],
    "Adjudikasi": [
      "Bimbingan Pelayanan Tahanan Kota", 
      "Bimbingan Pelayanan Tahanan Rumah", 
      "Bimbingan Klien yang Tidak Ditahan", 
      "Bimbingan Klien Diversi/Pelaksanaan Kesepakatan Diversi"
    ],
    "Pasca Adjudikasi": [
      "Putusan Pemenjaraan",
      "Pelayanan Pembimbingan Putusan Non-Pemenjaraan",
      "Klien Menjalani Program Integrasi",
      "Pidana Peringatan (Anak)",
      "Pidana Pembinaan di Luar Lembaga (Anak)",
      "Pidana Pelayanan Masyarakat (Anak)",
      "Pidana Pelatihan Kerja (Anak)",
      "Pidana Pembinaan dalam Lembaga (Anak)",
      "Pidana Penetapan Tindakan (Anak)",
      "Penetapan Anak di Bawah 12 Tahun",
      "Pidana Pengawasan",
      "Pidana Kerja Sosial",
      "Pembimbingan Asimilasi",
      "Pembimbingan Cuti Bersyarat (CB)",
      "Pembimbingan Cuti Menjelang Bebas (CMB)",
      "Pembimbingan Pembebasan Bersyarat (PB)",
      "Pembimbingan Cuti Mengunjungi Keluarga (CMK)",
      "Pembimbingan Cuti di Luar Negeri (CDK)",
      "Bimbingan Lanjutan (Aftercare)"
    ]
  },
  pengawasan: {
    "Pra Adjudikasi": [
      "Pengawasan Keputusan Anak di Bawah 12 Tahun",
      "Pengawasan Layanan Tahanan",
      "Pengawasan Kesepakatan Diversi",
      "Pengawasan Pelayanan Tahanan Kota"
    ],
    "Adjudikasi": [
      "Pengawasan Layanan Tahanan",
      "Pengawasan Pelayanan Tahanan Kota",
      "Pengawasan Pelayanan Tahanan Rumah",
      "Pengawasan Klien Tidak Ditahan"
    ],
    "Pasca Adjudikasi": [
      "Putusan Pemenjaraan",
      "Pengawasan Pembimbingan Putusan Non-Pemenjaraan",
      "Pengawasan Klien Program Integrasi",
      "Pengawasan Bimbingan Lanjutan (Aftercare)"
    ]
  }
};

// --- HIERARKI LAYANAN DEWASA ---
export const HIERARKI_LAYANAN_DEWASA = {
  pendampingan: {
    "Pra Ajudikasi": [
      "Pendampingan Tingkat Penyidikan (BAP)",
      "Pendampingan Tingkat Penuntutan (P21)",
      "Pendampingan Layanan Tahanan"
    ],
    "Ajudikasi": [
      "Pendampingan Tingkat Pemeriksaan Perkara di Pengadilan",
      "Pendampingan Layanan Tahanan dalam Tahap Persidangan"
    ],
    "Pasca Ajudikasi": [
      "Pendampingan Putusan Penjara",
      "Pendampingan Putusan Non Pemenjaraan",
      "Pendampingan Klien Menjalani Program Integrasi"
    ]
  },

  litmas: {
    "Pra Adjudikasi": [
      "Litmas Sidang",
      "Litmas Restorative Justice",
      "Litmas Perawatan",
      "Litmas Penempatan"
    ],
    "Adjudikasi": [
      "Litmas Sidang",
      "Litmas Perawatan",
      "Litmas Penempatan"
    ],
    "Pasca Adjudikasi": [
      "Litmas Pembinaan Awal",
      "Litmas Program Bimbingan",
      "Litmas Pemindahan",
      "Litmas Program Asimilasi",
      "Litmas Program CMK",
      "Litmas Program CDK",
      "Asimilasi Tempat Tinggal/ Rumah Antara",
      "Litmas Re-integrasi CB",
      "Litmas Re-integrasi CMB",
      "Litmas Re-integrasi PB",
      "Litmas Grasi",
      "Litmas Perubahan Pidana"
    ]
  },

  pembimbingan: {
    "Pra Adjudikasi": [
      "Bimbingan Pelayanan Tahanan Kota",
      "Bimbingan Pelayanan Tahanan Rumah",
      "Bimbingan Klien yang Tidak Ditahan"
    ],
    "Adjudikasi": [
      "Bimbingan Pelayanan Tahanan Kota",
      "Bimbingan Pelayanan Tahanan Rumah",
      "Bimbingan Klien yang Tidak Ditahan"
    ],
    "Pasca Adjudikasi": [
      "Putusan Pemenjaraan",
      "Pelayanan Pembimbingan Putusan Non Pemenjaraan",
      "Pidana Pengawasan",
      "Pidana Kerja Sosial",
      "Pembimbingan Asimilasi",
      "Pembimbingan CB",
      "Pembimbingan CMB",
      "Pembimbingan PB",
      "Pembimbingan CMK",
      "Pembimbingan CDK",
      "Bimbingan Lanjutan (aftercare)"
    ]
  },

  pengawasan: {
    "Pra Adjudikasi": [
      "Pengawasan Layanan Tahanan",
      "Pengawasan Pelayanan Tahanan Kota",
      "Pengawasan Pelayanan Tahanan Rumah",
      "Pengawasan Klien Tidak Ditahan"
    ],
    "Adjudikasi": [
      "Pengawasan Layanan Tahanan",
      "Pengawasan Pelayanan Tahanan Kota",
      "Pengawasan Pelayanan Tahanan Rumah",
      "Pengawasan Klien Tidak Ditahan"
    ],
    "Pasca Adjudikasi": [
      "Putusan Pemenjaraan",
      "Pengawasan Pelayanan Pembimbingan Putusan Non Pemenjaraan",
      "Pengawasan Klien Menjalani Program Integrasi",
      "Pengawasan Bimbingan Lanjutan (aftercare)"
    ]
  }
};