import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { supabase } from '@/integrations/supabase/client';

// IMPORT KOMPONEN POP UP SHADCN UI
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // STATE UNTUK MENAMPILKAN POP-UP
  const [showIdleAlert, setShowIdleAlert] = useState(false);

  // AMBIL PENANDA STATUS CAPTCHA DARI SESSION STORAGE
  const isCaptchaVerified = sessionStorage.getItem('captcha_verified') === 'true';

  // PANGGIL HOOK: Jika idle 60 menit, set state Pop-up jadi true
  useIdleTimeout(60, () => {
    setShowIdleAlert(true);
  });

  // FUNGSI SAAT TOMBOL "OK" DI-KLIK
  const handleIdleLogout = async () => {
    setShowIdleAlert(false); // Tutup pop-up
    await supabase.auth.signOut(); // Logout dari supabase
    sessionStorage.removeItem('captcha_verified'); // Hapus sesi CAPTCHA
    navigate('/login', { replace: true }); // Lempar ke login
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // BLOKIR AKSES JIKA: Belum login dari Supabase ATAU CAPTCHA belum diverifikasi
  if (!user || !isCaptchaVerified) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      const hasAll = permissions.every(p => hasPermission(p));
      if (!hasAll) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (!hasAnyPermission(permissions)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    if (requireAll) {
      const hasAll = roles.every(r => hasRole(r));
      if (!hasAll) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (!hasAnyRole(roles)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return (
    <>
      {/* TAMPILKAN KONTEN HALAMAN */}
      {children}

      {/* TAMPILKAN POP-UP JIKA IDLE (Akan menutupi konten halaman) */}
      <AlertDialog open={showIdleAlert}>
        <AlertDialogContent className="max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              ⏱️
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sesi Berakhir</h2>
              <p className="text-sm opacity-90">
                Anda tidak aktif terlalu lama
              </p>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 text-center">
            <p className="text-slate-700 text-sm leading-relaxed">
              Demi keamanan, sistem telah mengakhiri sesi Anda setelah <b>60 menit tanpa aktivitas</b>.
            </p>

            <div className="mt-4 bg-slate-100 p-3 rounded-lg text-sm text-slate-600">
              Silakan login kembali untuk melanjutkan pekerjaan Anda.
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t flex justify-center">
            <AlertDialogAction
              onClick={handleIdleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Login Kembali
            </AlertDialogAction>
          </div>

        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}