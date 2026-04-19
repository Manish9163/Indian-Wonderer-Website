import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, X, Sun, Moon, Github, Chrome, Globe, Sparkles, UserPlus, LogIn, Award } from "lucide-react";
import ReactCountryFlag from 'react-country-flag';
import * as avatars from '@dicebear/avatars';
import * as style from '@dicebear/avatars-avataaars-sprites';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const API_BASE_URL = 'http://localhost/fu/backend/api';

interface UserAuthProps {
  onAuthSuccess: (userData: any) => void;
  showToast?: {
    showSuccess: (title: string, message: string, duration?: number) => void;
    showError: (title: string, message: string, duration?: number) => void;
    showWarning: (title: string, message: string, duration?: number) => void;
    showInfo: (title: string, message: string, duration?: number) => void;
  };
}

const UserAuth: React.FC<UserAuthProps> = ({ onAuthSuccess, showToast }) => {
  const [step, setStep] = useState<'auth' | 'otp'>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // State from original component
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    address: '',
    country: '',
    photo: null,
    terms: false
  });
  const [signupErrors, setSignupErrors] = useState<{ [key: string]: string }>({});
  const [signupStep, setSignupStep] = useState(0);
  const [avatarSeed, setAvatarSeed] = useState('traveler');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const avatarSelectorRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    otp: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [shake, setShake] = useState(false);
  const [dark, setDark] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const loginBgRef = useRef<HTMLImageElement>(null);
  const signupBgRef = useRef<HTMLImageElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const loginTextRef = useRef<HTMLDivElement>(null);
  const signupTextRef = useRef<HTMLDivElement>(null);

  const motivationalQuotes = [
    "Adventure awaits!",
    "Travel is the only thing you buy that makes you richer.",
    "Explore the world, discover yourself.",
    "Collect moments, not things.",
    "Let your dreams set sail!"
  ];

  // GSAP Animations Core
  useGSAP(() => {
    // Background Ken Burns Effect (Continuous)
    gsap.to([loginBgRef.current, signupBgRef.current], {
      scale: 1.15,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    // Initial Entrance
    gsap.set(formPanelRef.current, { left: mode === 'login' ? '50%' : '0%' });
    gsap.fromTo(formPanelRef.current,
      { opacity: 0, xPercent: mode === 'login' ? 50 : -50 },
      { opacity: 1, xPercent: 0, duration: 1.5, ease: "expo.out", delay: 0.5 }
    );
  }, { scope: containerRef });

  // Mode Switching Animation Logic
  const handleModeChange = (newMode: 'login' | 'signup') => {
    if (newMode === mode) return;

    const tl = gsap.timeline({
      onStart: () => setIsLoading(true),
      onComplete: () => setIsLoading(false)
    });

    // 1. Move the panel and images
    const isLogin = newMode === 'login';

    tl.to(formPanelRef.current, {
      left: isLogin ? '50%' : '0%',
      duration: 1.2,
      ease: "expo.inOut"
    });

    tl.to([loginTextRef.current, signupTextRef.current], {
      left: isLogin ? '0%' : '50%',
      duration: 1.2,
      ease: "expo.inOut"
    }, 0);

    // 2. Crossfade Backgrounds
    if (isLogin) {
      tl.to(signupBgRef.current, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, 0);
      tl.to(loginBgRef.current, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0);
    } else {
      tl.to(loginBgRef.current, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, 0);
      tl.to(signupBgRef.current, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0);
    }

    // Update state mid-animation
    setMode(newMode);
    setSignupStep(0);
  };

  // Original UI Handlers
  const handleGoogleAuth = () => window.open('https://accounts.google.com/o/oauth2/v2/auth', '_blank');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarSelectorRef.current && !avatarSelectorRef.current.contains(event.target as Node)) {
        setShowAvatarSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateSignup = () => {
    const errors: { [key: string]: string } = {};
    if (!signupData.firstName) errors.firstName = 'Required';
    if (!signupData.lastName) errors.lastName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) errors.email = 'Invalid';
    if (!/^\d{10}$/.test(signupData.phone)) errors.phone = '10 digits';
    if (signupData.password.length < 8) errors.password = 'Min 8 chars';
    if (signupData.password !== signupData.confirmPassword) errors.confirmPassword = 'Mismatch';
    if (!signupData.dob) errors.dob = 'Required';
    if (!signupData.gender) errors.gender = 'Required';
    if (!signupData.terms) errors.terms = 'Required';
    return errors;
  };

  const handleSignupChange = (field: string, value: any) => setSignupData((prev) => ({ ...prev, [field]: value }));

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSignup();
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) { triggerShake(); return; }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: signupData.email.split('@')[0],
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password
        })
      });
      const data = await response.json();
      if (data.success) {
        const userData = { ...data.data.user, avatarSvg: avatars.createAvatar(style, { seed: avatarSeed }), token: data.data.token };
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        onAuthSuccess(userData);
      } else {
        setSignupErrors({ email: data.message || 'Error' });
        triggerShake();
      }
    } catch (err) { triggerShake(); } finally { setIsLoading(false); }
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleInputChange = (field: string, value: string) => {
    if (field === "otp") {
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, otp: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdminLogin = formData.identifier === 'admin@indianwonderer.com' || formData.identifier === 'admin';
    if (!formData.identifier || !formData.password) { triggerShake(); return; }
    setIsLoading(true);
    try {
      if (isAdminLogin) {
        const formDataBody = new URLSearchParams();
        formDataBody.append(formData.identifier.includes('@') ? 'email' : 'username', formData.identifier);
        formDataBody.append('password', formData.password);
        const response = await fetch(`${API_BASE_URL}/admin_login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formDataBody
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('adminAuthenticated', 'true');
          localStorage.setItem('adminData', JSON.stringify(data.data));
          window.location.href = 'http://localhost:4200/dashboard';
          return;
        }
      }
      const resp = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.identifier, password: formData.password })
      });
      const data = await resp.json();
      if (data.success) {
        const userData = { ...data.data.user, avatarSvg: avatars.createAvatar(style, { seed: avatarSeed }), token: data.data.token };
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        onAuthSuccess(userData);
      } else {
        setErrors({ password: data.message || 'Failed' });
        triggerShake();
      }
    } catch (err) { triggerShake(); } finally { setIsLoading(false); }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length < 6) { triggerShake(); return; }
    setIsLoading(true);
    setTimeout(() => {
      onAuthSuccess({ id: 'u_' + Date.now(), identifier: formData.identifier, avatarSvg: avatars.createAvatar(style, { seed: avatarSeed }) });
    }, 1000);
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full relative overflow-hidden bg-[#0A0A0A] dark">
      {/* Dynamic Image Layers (Full Screen Background) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Login Background (Palace) */}
        <img
          ref={loginBgRef}
          src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop"
          alt="Palace Login"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${mode === 'login' ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Signup Background (Mountain Monastery) */}
        <img
          ref={signupBgRef}
          src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070&auto=format&fit=crop"
          alt="Monastery Signup"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${mode === 'signup' ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Main Content Layout Container */}
      <div className="relative z-20 w-full h-screen overflow-hidden">

        {/* Side A: Cinematic Text Overlay Area */}
        <div
          ref={loginTextRef}
          className={`hidden lg:flex absolute top-0 left-0 w-1/2 h-full flex-col justify-end p-20 text-white pointer-events-none transition-opacity duration-700 ${mode === 'login' ? 'opacity-100' : 'opacity-0'}`}
        >
          <label className="text-primary tracking-[0.4em] text-xs uppercase mb-4 block font-bold opacity-80">Imperial Wonderer</label>
          <h1 className="text-7xl font-serif leading-tight mb-6">Return to <br /><span className="italic text-primary">Grace</span></h1>
          <p className="text-lg opacity-60 font-light leading-relaxed max-w-md">Your curated journey remains as you left it. Re-enter the legacy of the Silk Road.</p>
        </div>

        <div
          ref={signupTextRef}
          className={`hidden lg:flex absolute top-0 left-1/2 w-1/2 h-full flex-col justify-end p-20 text-white pointer-events-none transition-opacity duration-700 ${mode === 'signup' ? 'opacity-100' : 'opacity-0'}`}
        >
          <label className="text-primary tracking-[0.4em] text-xs uppercase mb-4 block font-bold opacity-80">Ascend with Us</label>
          <h1 className="text-7xl font-serif leading-tight mb-6">Forge a <br /><span className="italic text-primary">New Legacy</span></h1>
          <p className="text-lg opacity-60 font-light leading-relaxed max-w-md">Begin your initiation into the sanctuary of world-class travel. Explorers start here.</p>
        </div>

        {/* Side B: Auth Panel (The Active Slider) */}
        <div
          ref={formPanelRef}
          className="absolute top-0 w-full lg:w-1/2 h-full flex items-center justify-center p-4 lg:p-12 z-30"
        >
          <div className={`w-full max-w-[480px] p-8 lg:p-12 rounded-[2.5rem] border border-white/10 ${mode === 'login' ? 'bg-black/40 shadow-primary/10' : 'bg-[#0f172a]/40 shadow-blue-500/10'} backdrop-blur-3xl shadow-2xl ${shake ? "animate-shake" : ""}`}>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6 group transition-all duration-500 hover:scale-110">
                <Award className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-4xl font-serif text-white mb-2">
                {step === 'otp' ? 'Verification' : mode === 'login' ? 'Welcome Back' : 'Initiation'}
              </h2>
              <p className="text-white/40 font-light tracking-wide text-xs uppercase tracking-[0.2em]">
                {mode === 'login' ? 'Pathfinder Access' : 'Explorer Registration'}
              </p>
            </div>

            {step === 'auth' ? (
              <div className="animate-fadeIn">
                {mode === 'login' ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-2">Identify Yourself</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <input type="text" value={formData.identifier} onChange={(e) => handleInputChange("identifier", e.target.value)} placeholder="Email or Phone" className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center"><label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-2">Key</label><button type="button" className="text-[10px] text-white/20 hover:text-white uppercase transition-colors">Forgotten?</button></div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                        <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-[#B8860B] text-black font-bold py-5 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/10">
                      {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black" /> : <><span>ENTER THE REALM</span> <ArrowRight size={18} /></>}
                    </button>
                    <div className="pt-4 flex flex-col items-center gap-6">
                      <div className="w-full h-px bg-white/5 relative"><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0A0A0A] px-4 text-[10px] uppercase text-white/20 tracking-widest leading-none">Oracle Sanctuary</span></div>
                      <button type="button" onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl py-4 text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-sm font-light uppercase tracking-widest"><Chrome className="w-4 h-4" /> Google Secure</button>
                    </div>
                    <p className="text-center text-white/30 text-[11px] uppercase tracking-widest pt-4">No initiation? <button type="button" onClick={() => handleModeChange('signup')} className="text-primary font-bold hover:underline">Create an account</button></p>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-6">
                    <div className="flex gap-1 mb-8">
                      {[0, 1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-700 ${signupStep >= s ? 'bg-primary shadow-[0_0_10px_rgba(242,202,80,0.5)]' : 'bg-white/5'}`} />)}
                    </div>
                    <div className="min-h-[220px]">
                      {signupStep === 0 && <div className="space-y-4 animate-slideUp"><div className="grid grid-cols-2 gap-3"><input placeholder="First Name" value={signupData.firstName} onChange={e => handleSignupChange('firstName', e.target.value)} className="luxury-input w-full" /><input placeholder="Last Name" value={signupData.lastName} onChange={e => handleSignupChange('lastName', e.target.value)} className="luxury-input w-full" /></div><input placeholder="Email" value={signupData.email} onChange={e => handleSignupChange('email', e.target.value)} className="luxury-input w-full" /><input placeholder="Mobile" value={signupData.phone} onChange={e => handleSignupChange('phone', e.target.value)} className="luxury-input w-full" /></div>}
                      {signupStep === 1 && <div className="space-y-4 animate-slideUp"><input placeholder="Secret Password" type="password" value={signupData.password} onChange={e => handleSignupChange('password', e.target.value)} className="luxury-input w-full" /><input placeholder="Repeat Secret" type="password" value={signupData.confirmPassword} onChange={e => handleSignupChange('confirmPassword', e.target.value)} className="luxury-input w-full" /></div>}
                      {signupStep === 2 && <div className="space-y-4 animate-slideUp"><label className="text-[10px] uppercase text-white/40 ml-2">Date of Birth</label><input type="date" value={signupData.dob} onChange={e => handleSignupChange('dob', e.target.value)} className="luxury-input w-full" /></div>}
                      {signupStep === 3 && <div className="text-center animate-slideUp py-6"><p className="text-primary italic font-serif text-lg mb-8">"{motivationalQuotes[signupStep]}"</p><div className="flex items-center gap-3 justify-center"><input type="checkbox" checked={signupData.terms} onChange={e => handleSignupChange('terms', e.target.checked)} className="rounded-full bg-white/10 border-white/20 transition-all checked:bg-primary" /><span className="text-[11px] text-white/30 uppercase tracking-widest">Agree to the covenant</span></div></div>}
                    </div>
                    <div className="flex gap-4 pt-6">
                      {signupStep > 0 && <button type="button" onClick={() => setSignupStep(s => s - 1)} className="flex-1 py-4 text-white/40 uppercase text-[10px] tracking-widest border border-white/10 rounded-xl hover:text-white">Previous</button>}
                      <button type="button" onClick={() => signupStep < 3 ? setSignupStep(s => s + 1) : handleSignupSubmit(undefined as any)} className="flex-[2] py-4 bg-white/10 text-white rounded-xl uppercase text-[10px] tracking-widest font-bold hover:bg-primary hover:text-black transition-all">
                        {signupStep < 3 ? 'Next Phase' : 'Ascend Now'}
                      </button>
                    </div>
                    <p className="text-center text-white/30 text-[11px] uppercase tracking-widest pt-4">Already initiated? <button type="button" onClick={() => handleModeChange('login')} className="text-primary font-bold hover:underline">Return to Portal</button></p>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-8 animate-fadeIn text-center">
                <p className="text-white/40 text-xs font-light tracking-widest italic">Sacred numbers sent to your oracle</p>
                <input type="text" value={formData.otp} onChange={(e) => handleInputChange("otp", e.target.value)} placeholder="000 000" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-8 text-white text-center text-5xl font-mono tracking-[0.4em] focus:border-primary/40 focus:bg-primary/5 transition-all" maxLength={6} />
                <button type="submit" disabled={isLoading || formData.otp.length < 6} className="w-full bg-primary text-black font-extrabold py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl shadow-primary/20">Decrypt Experience</button>
                <button type="button" onClick={() => setStep('auth')} className="text-white/20 hover:text-white text-[10px] uppercase tracking-widest transition-colors">Wrong identity?</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .luxury-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }
        .luxury-input:focus {
          outline: none;
          border-color: rgba(242, 202, 80, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }
      `}</style>
    </div>
  );
};

export default UserAuth;
