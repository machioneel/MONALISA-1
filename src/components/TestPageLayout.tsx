// src/components/TestPageLayout.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ModeToggle } from "@/components/ModeToggle"; // IMPORT BARU
import { 
  ArrowLeft, User, Shield, Key, CheckCircle, Menu, X, Settings, 
  Building2, Users, ClipboardList, BarChart3, Mail, Briefcase, 
  TrendingUp, FileText, LogOut, AlertTriangle, Lock, Info, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const menuItems = [
  { path: '/admin', permission: 'access_admin', label: 'Admin Panel', icon: Settings },
  { path: '/test/kabapas', permission: 'access_kabapas', label: 'Kabapas', icon: Building2 },
  { path: '/test/kasie', permission: 'access_kasie', label: 'Kasie', icon: Shield },
  { path: '/test/kasubsie', permission: 'access_kasubsie', label: 'Kasubsie', icon: Users },
  { path: '/test/operator-registrasi', permission: 'access_operator_registrasi', label: 'Registrasi', icon: ClipboardList },
  { path: '/test/anev', permission: 'access_anev', label: 'Anev', icon: BarChart3 },
  { path: '/test/pk', permission: 'access_pk', label: 'PK', icon: User },
  { path: '/test/persuratan', permission: 'access_persuratan', label: 'Persuratan', icon: Mail },
  { path: '/test/bimker', permission: 'access_bimker', label: 'Bimker', icon: Briefcase },
  { path: '/test/bimkemas', permission: 'access_bimkemas', label: 'Bimkemas', icon: Users },
  { path: '/test/tpp', permission: 'access_tpp', label: 'TPP', icon: TrendingUp },
  { path: '/test/laporan', permission: 'access_laporan', label: 'Laporan', icon: FileText },
  { path: '/wajib-lapor', permission: 'access_admin', label: 'Wajib Lapor', icon: CheckCircle },
  { path: '/about', permission:'access_admin', label: 'About', icon: Info},
];

interface TestPageLayoutProps {
  title: string;
  description: string;
  permissionCode: string;
  icon: React.ReactNode;
  children?: React.ReactNode; 
  action?: React.ReactNode;
}

export function TestPageLayout({ title, description, permissionCode, icon, children, action }: TestPageLayoutProps) {
  const { user, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', String(isSidebarMinimized));
  }, [isSidebarMinimized]);

  const hasAccess = hasPermission(permissionCode);
  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));
  
  // @ts-ignore
  const fotoUrl = user?.employee?.foto_url;

  const handleConfirmSignOut = async () => {
    try {
        await signOut();
        toast({ title: "Berhasil Logout", description: "Sampai jumpa kembali!", duration: 3000 });
        navigate('/login');
    } catch (error) {
        toast({ variant: "destructive", title: "Gagal Logout", description: "Terjadi kesalahan saat mencoba keluar." });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r dark:border-slate-800 relative">
      <div className={cn("h-16 flex items-center border-b dark:border-slate-800 shrink-0 relative", isSidebarMinimized ? "justify-center px-0" : "px-6")}>
        <div className={cn("w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0", !isSidebarMinimized && "mr-3")}>
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        {!isSidebarMinimized && <span className="text-lg font-bold text-slate-800 dark:text-white">MONALISA</span>}
        
        <Button 
            variant="outline" 
            size="icon" 
            className="hidden md:flex absolute -right-3 top-5 h-6 w-6 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm z-50 text-slate-500 hover:text-slate-700" 
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
        >
            {isSidebarMinimized ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

      <div className={cn("flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar", isSidebarMinimized ? "px-2" : "px-3")}>
        <Button 
            variant="ghost" 
            title={isSidebarMinimized ? "Dashboard" : undefined}
            className={cn(
                "mb-1 flex items-center", 
                location.pathname === '/dashboard' ? "bg-slate-100 dark:bg-slate-800 text-primary font-medium" : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800",
                isSidebarMinimized ? "w-11 px-0 mx-auto justify-center" : "w-full justify-start"
            )} 
            onClick={() => navigate('/dashboard')}
        >
          <div className={cn("w-5 h-5 flex items-center justify-center shrink-0", !isSidebarMinimized && "mr-3")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
          </div>
          {!isSidebarMinimized && "Dashboard"}
        </Button>

        <div className={cn("text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2", isSidebarMinimized ? "text-center text-[9px] px-0" : "px-3")}>
            {isSidebarMinimized ? "APP" : "Menu Aplikasi"}
        </div>
        
        {accessibleMenus.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button 
                key={item.path} 
                variant={isActive ? "secondary" : "ghost"} 
                title={isSidebarMinimized ? item.label : undefined}
                className={cn(
                    "mb-1 flex items-center", 
                    isActive ? "bg-slate-100 dark:bg-slate-800 text-primary font-medium" : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800",
                    isSidebarMinimized ? "w-11 px-0 mx-auto justify-center" : "w-full justify-start"
                )} 
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-slate-500", !isSidebarMinimized && "mr-3")} />
              {!isSidebarMinimized && <span className="truncate">{item.label}</span>}
            </Button>
          );
        })}
      </div>

      <div className={cn("p-4 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0", isSidebarMinimized && "flex flex-col items-center px-2")}>
        {!isSidebarMinimized ? (
            <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                    {fotoUrl ? <img src={fotoUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-slate-400" />}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.employee.nama}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.employee.jabatan || 'User'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <ModeToggle /> {/* MODE TOGGLE DI SINI */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30">
                                <LogOut className="w-4 h-4 mr-2" /> Keluar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan diakhiri.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleConfirmSignOut} className="bg-red-600 hover:bg-red-700 text-white">Ya, Keluar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </>
        ) : (
            <div className="flex flex-col gap-3">
                <ModeToggle /> {/* MODE TOGGLE DI SINI UNTUK KONDISI MINIMIZE */}
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 mb-3" title={user?.employee.nama}>
                    {fotoUrl ? <img src={fotoUrl} alt="User" className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-slate-400" />}
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="w-10 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30 rounded-lg transition-colors" title="Keluar">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle><AlertDialogDescription>Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan diakhiri.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleConfirmSignOut} className="bg-red-600 hover:bg-red-700 text-white">Ya, Keluar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <aside className={cn("hidden md:block fixed inset-y-0 z-30 shadow-sm transition-all duration-300 ease-in-out", isSidebarMinimized ? "w-20" : "w-64")}>
          <SidebarContent />
      </aside>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-300 shadow-2xl">
             <div className="relative h-full flex flex-col">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-50" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}
      
      <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out", isSidebarMinimized ? "md:pl-20" : "md:pl-64")}>
        <header className="md:hidden bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" /></Button>
             <span className="font-semibold text-lg tracking-tight text-slate-800 dark:text-white">MONALISA</span>
          </div>
          <ModeToggle />
        </header>

        <div className="p-4 sm:p-6 w-full space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </div>

          <Card className={cn("border-0 shadow-md dark:bg-slate-900 overflow-hidden", !hasAccess ? "ring-2 ring-red-500/20" : "")}>
            <div className={cn("h-1.5 w-full", hasAccess ? "bg-primary" : "bg-red-500")}></div>
            <CardHeader className="bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", hasAccess ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600")}>
                    {hasAccess ? icon : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {title}
                        {!hasAccess && <Badge variant="destructive" className="ml-2 font-normal text-xs">Akses Ditolak</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
              </div>
            </CardHeader>
          </Card>

          {!hasAccess ? (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Izin Diperlukan</AlertTitle>
              <AlertDescription>Anda memerlukan permission <code>{permissionCode}</code> untuk mengakses halaman ini.</AlertDescription>
            </Alert>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          )}

          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 mt-8 opacity-75 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <Shield className="w-4 h-4" /> Debug Akses Control
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="flex flex-wrap gap-2">
                 <Badge variant="outline">User: {user?.employee.nama}</Badge>
                 <Badge variant="outline">Roles: {user?.roles.join(', ') || '-'}</Badge>
                 <Badge variant={hasAccess ? "default" : "destructive"}>
                    Status: {hasAccess ? "GRANTED" : "DENIED"}
                 </Badge>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}