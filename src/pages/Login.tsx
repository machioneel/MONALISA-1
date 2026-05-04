import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import { z } from 'zod';

// Skema validasi untuk NIP dan Password
const loginSchema = z.object({
  nip: z.string().min(1, 'NIP harus diisi').regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// Skema validasi untuk OTP
const otpSchema = z.object({
  otp: z.string().length(6, 'Kode OTP harus 6 digit').regex(/^\d+$/, 'OTP hanya berisi angka'),
});

export default function Login() {
  // State kredensial
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // State untuk alur UI
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ nip?: string; password?: string; otp?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // PERBAIKAN LOGIKA REDIRECT: Jangan redirect instan jika animasi (showWelcome) sedang berjalan
  useEffect(() => {
    const isOtpVerified = sessionStorage.getItem('otp_verified') === 'true';
    
    // Auto-redirect jika user iseng buka URL /login saat sudah diverifikasi penuh
    if (user && isOtpVerified && !showWelcome) {
      navigate(from, { replace: true });
    }
    
    // Bersihkan sesi OTP jika user dalam status logout (untuk keamanan)
    if (!user) {
      sessionStorage.removeItem('otp_verified');
    }
  }, [user, showWelcome, navigate, from]);

  // TAHAP 1: Submit NIP & Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const result = loginSchema.safeParse({ nip, password });
    if (!result.success) {
      const errors: { nip?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'nip') errors.nip = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    // Memvalidasi kredensial pengguna ke Supabase
    const { error: signInError } = await signIn(nip, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
    } else {
      // Jika berhasil, buat kode OTP acak
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      
      try {
        // Memanggil Edge Function untuk mengirim OTP via WhatsApp
        await supabase.functions.invoke('send-wa-otp', {
            body: { nip, otp: newOtp }
        });
        
        // Ubah tampilan ke form OTP
        setStep('otp');
      } catch (funcError) {
        setError('Berhasil login, namun gagal mengirimkan kode OTP ke WhatsApp Anda.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // TAHAP 2: Verifikasi OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const result = otpSchema.safeParse({ otp: otpCode });
    if (!result.success) {
      setValidationErrors({ otp: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);

    // Simulasi jeda singkat agar UX terasa natural (proses verifikasi)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Membandingkan OTP yang dimasukkan dengan OTP yang dikirim
    if (otpCode === generatedOtp) {
      // SET FLAG OTP TERVERIFIKASI
      sessionStorage.setItem('otp_verified', 'true');
      
      // Memicu animasi "Selamat Datang"
      setShowWelcome(true);
      setIsLoading(false);

      // Pindah ke dashboard setelah animasi selesai (2 detik)
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 2000);
    } else {
      setError('Kode OTP salah. Silakan periksa pesan WhatsApp Anda.');
      setIsLoading(false);
    }
  };

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 relative">
      
      {/* ANIMASI SAAT PROSES VERIFIKASI OTP */}
      {isLoading && step === 'otp' && !showWelcome && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
              <div className="absolute inset-4 bg-blue-500/40 rounded-full animate-pulse" />
              <div className="relative z-10 bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                <KeyRound className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Memverifikasi OTP</h3>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Mencocokkan kode keamanan...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ANIMASI SAAT LOGIN SUKSES SEPENUHNYA */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-4 animate-in zoom-in-50 slide-in-from-bottom-10 duration-500 fill-mode-forwards">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                 <CheckCircle2 className="h-10 w-10 text-green-600 animate-in spin-in-180 duration-700" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Login Berhasil!</h2>
              <p className="text-muted-foreground text-lg">
                Selamat datang kembali di MONALISA...
              </p>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden mt-6">
                <div className="h-full bg-primary animate-in slide-in-from-left duration-[2000ms] w-full" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center p-8 md:p-12 lg:p-24 bg-background animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-2xl mb-4 shadow-sm">
               <img 
                  src="/favicon.ico" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain" 
                />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              MONALISA
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoring dan Evaluasi Kinerja Layanan Publik
            </p>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-lg">
             <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-xl text-center">
                    {step === 'login' ? 'Login Pegawai' : 'Verifikasi 2 Langkah'}
                </CardTitle>
                <CardDescription className="text-center">
                   {step === 'login' ? 'Masuk menggunakan NIP dan Password' : 'Masukkan kode OTP yang dikirim ke WhatsApp Anda'}
                </CardDescription>
             </CardHeader>

            <CardContent className="pt-4">
              
              {error && (
                <Alert variant="destructive" className="mb-4 animate-in zoom-in-95 duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* TAMPILAN FORM LOGIN KREDENSIAL */}
              {step === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nip" className={validationErrors.nip ? 'text-destructive' : ''}>
                        NIP
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="nip"
                          type="text"
                          placeholder="Nomor Induk Pegawai"
                          value={nip}
                          onChange={(e) => setNip(e.target.value)}
                          disabled={isLoading || showWelcome}
                          className={`pl-10 transition-all ${validationErrors.nip ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                        />
                      </div>
                      {validationErrors.nip && (
                        <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                          {validationErrors.nip}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className={validationErrors.password ? 'text-destructive' : ''}>
                            Password
                        </Label>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                            Lupa password?
                        </Link>
                      </div>
                      
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handleCapsLock}
                          onKeyUp={handleCapsLock}
                          onBlur={() => setIsCapsLockOn(false)}
                          disabled={isLoading || showWelcome}
                          className={`pl-10 pr-10 transition-all ${validationErrors.password ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || showWelcome}
                          tabIndex={-1} 
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">Toggle visibility</span>
                        </Button>
                      </div>

                      {isCapsLockOn && (
                        <p className="text-[0.8rem] font-medium text-amber-600 animate-in slide-in-from-top-1">
                          ⚠️ Caps Lock aktif
                        </p>
                      )}

                      {validationErrors.password && (
                        <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                          {validationErrors.password}
                        </p>
                      )}
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" 
                        disabled={isLoading || showWelcome}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa Data...</>
                      ) : (
                        'Masuk Aplikasi'
                      )}
                    </Button>
                  </form>
              )}

              {/* TAMPILAN FORM OTP */}
              {step === 'otp' && (
                  <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className={validationErrors.otp ? 'text-destructive' : ''}>
                        Kode OTP (6 Digit)
                      </Label>
                      <div className="relative group">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="••••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          disabled={isLoading || showWelcome}
                          className={`pl-10 font-mono tracking-widest text-center text-lg transition-all ${validationErrors.otp ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                        />
                      </div>
                      {validationErrors.otp && (
                        <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1">
                          {validationErrors.otp}
                        </p>
                      )}
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Belum menerima kode? <button type="button" className="text-primary hover:underline" onClick={handleLoginSubmit}>Kirim ulang</button>
                      </p>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-medium bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all hover:scale-[1.01]" 
                        disabled={isLoading || showWelcome || otpCode.length !== 6}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memverifikasi...</>
                      ) : showWelcome ? (
                        'Berhasil Masuk'
                      ) : (
                        'Verifikasi & Lanjutkan'
                      )}
                    </Button>
                    
                    <div className="text-center pt-2">
                      <button 
                        type="button" 
                        onClick={async () => { 
                            setStep('login'); 
                            setOtpCode(''); 
                            setError(null); 
                            await supabase.auth.signOut(); 
                        }}
                        className="text-sm text-muted-foreground underline hover:text-primary transition-colors"
                      >
                        Kembali ke Login
                      </button>
                    </div>
                  </form>
              )}

            </CardContent>
          </Card>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
             Aplikasi Internal <br />
             <span className="font-medium text-foreground">Bapas Kelas I Jakarta Barat</span>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex relative flex-col bg-slate-900 text-white p-12 justify-between overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/40 z-10" />
        <img 
            src="https://kemenimipas.go.id/attachments/2025/gedung_baru_kemenimipas_tampak_muka.jpeg" 
            alt="Office Background" 
            className="absolute inset-0 object-cover w-full h-full opacity-100 mix-blend-overlay animate-in fade-in duration-1000"
        />
        
        <div className="relative z-20 flex items-center gap-3 animate-in slide-in-from-top-8 duration-700 delay-200">
          <div className="h-10 w-10 bg-yellow-500/90 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20 overflow-hidden">
            <img 
              src="https://kemenimipas.go.id/images/logo/Kementerian-Hukum-Dan-Ham-Kemenkumham-Logo-Vector.png" 
              alt="Logo" 
              className="h-9.5 w-9.5 object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight">
              Kementerian Imigrasi dan Pemasyarakatan RI
            </h3>
            <p className="text-sm text-slate-300">
              Balai Pemasyarakatan Kelas I Jakarta Barat
            </p>
          </div>
        </div>
        
        <div className="relative z-20 max-w-lg mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <blockquote className="space-y-4">
                <p className="text-2xl font-medium leading-relaxed tracking-tight text-white/90">
                    &ldquo;Transformasi digital layanan pemasyarakatan untuk mewujudkan pelayanan publik yang PASTI (Profesional, Akuntabel, Sinergi, Transparan, dan Inovatif).&rdquo;
                </p>
                <div className="h-1 w-20 bg-yellow-500 rounded-full" />
            </blockquote>
        </div>
      </div>
    </div>
  );
}