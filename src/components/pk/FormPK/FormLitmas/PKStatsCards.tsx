import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Clock, CheckCircle, Activity, BookOpen, Shield } from 'lucide-react';

interface PKStatsCardsProps {
  activeTab: string;
  stats: {
    litmasBaru?: number;
    litmasSelesai?: number;
    litmasProses?: number;
    pendampinganAktif?: number;
    pendampinganSelesai?: number;
    jadwalSidang?: number;
    pembimbinganAktif?: number;
    wajibLaporHariIni?: number;
    pembimbinganSelesai?: number;
    totalKlien?: number;
    tugasAktif?: number;
  };
}

// Komponen kartu individual
function StatCard({ title, value, icon, bgColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string }) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-full ${bgColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}

// Sesuaikan nama fungsi di bawah ini dengan import yang kamu gunakan (PKStatCards atau PKStatsCards)
export function PKStatsCards({ activeTab = '', stats }: PKStatsCardsProps) {
  
  // Fungsi penentu kartu berdasarkan tab layanan yang aktif
  const renderCards = () => {
    // 1. UBAH KE HURUF KECIL: Memastikan pencocokan selalu berhasil terlepas dari huruf besar/kecil
    const currentTab = String(activeTab).toLowerCase();

    switch (currentTab) {
      case 'litmas':
        return (
          <>
            <StatCard title="Permintaan Litmas Baru" value={stats.litmasBaru || 0} icon={<FileText className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-100" />
            <StatCard title="Proses Pengumpulan Data" value={stats.litmasProses || 0} icon={<Clock className="w-6 h-6 text-amber-600" />} bgColor="bg-amber-100" />
            <StatCard title="Litmas Selesai" value={stats.litmasSelesai || 0} icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
          </>
        );
      case 'pendampingan':
        return (
          <>
            <StatCard title="Anak Didampingi Aktif" value={stats.pendampinganAktif || 0} icon={<Shield className="w-6 h-6 text-indigo-600" />} bgColor="bg-indigo-100" />
            <StatCard title="Jadwal Sidang / Diversi" value={stats.jadwalSidang || 0} icon={<Activity className="w-6 h-6 text-rose-600" />} bgColor="bg-rose-100" />
            <StatCard title="Pendampingan Selesai" value={stats.pendampinganSelesai || 0} icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
          </>
        );
      case 'pembimbingan':
        return (
          <>
            <StatCard title="Klien Bimbingan Aktif" value={stats.pembimbinganAktif || 0} icon={<Users className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-100" />
            <StatCard title="Wajib Lapor Hari Ini" value={stats.wajibLaporHariIni || 0} icon={<BookOpen className="w-6 h-6 text-amber-600" />} bgColor="bg-amber-100" />
            <StatCard title="Bimbingan Selesai" value={stats.pembimbinganSelesai || 0} icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-100" />
          </>
        );
      default:
        // Jika teks tab tidak dikenali (bukan dari 3 di atas), tampilkan default
        return (
          <>
            <StatCard title="Total Klien" value={stats.totalKlien || 0} icon={<Users className="w-6 h-6 text-slate-600" />} bgColor="bg-slate-100" />
            <StatCard title="Tugas Aktif Keseluruhan" value={stats.tugasAktif || 0} icon={<Activity className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-100" />
          </>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {renderCards()}
    </div>
  );
}