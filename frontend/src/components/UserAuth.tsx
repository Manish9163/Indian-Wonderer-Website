import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, X, Sun, Moon } from "lucide-react";
import ReactCountryFlag from 'react-country-flag';
import * as avatars from '@dicebear/avatars';
import * as style from '@dicebear/avatars-avataaars-sprites';

// Use absolute URL since proxy configuration isn't working as expected
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
  const [signupErrors, setSignupErrors] = useState<{[key: string]: string}>({});
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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [shake, setShake] = useState(false);
  const [dark, setDark] = useState(false);

  const motivationalQuotes = [
    "Adventure awaits!",
    "Travel is the only thing you buy that makes you richer.",
    "Explore the world, discover yourself.",
    "Collect moments, not things.",
    "Let your dreams set sail!"
  ];

  // Predefined avatar options
  const avatarOptions = [
    { name: 'Explorer', seed: 'explorer' },
    { name: 'Adventurer', seed: 'adventurer' },
    { name: 'Traveler', seed: 'traveler' },
    { name: 'Wanderer', seed: 'wanderer' },
    { name: 'Nomad', seed: 'nomad' },
    { name: 'Tourist', seed: 'tourist' },
    { name: 'Backpacker', seed: 'backpacker' },
    { name: 'Journey', seed: 'journey' },
    { name: 'Discovery', seed: 'discovery' },
    { name: 'Adventure', seed: 'adventure' },
    { name: 'Mountain', seed: 'mountain' },
    { name: 'Ocean', seed: 'ocean' },
    { name: 'Forest', seed: 'forest' },
    { name: 'Desert', seed: 'desert' },
    { name: 'Valley', seed: 'valley' },
    { name: 'Sunrise', seed: 'sunrise' }
  ];

  // Google Auth handler (replace with your OAuth logic)
  const handleGoogleAuth = () => {
    // TODO: Integrate Google OAuth here
    window.open('https://accounts.google.com/o/oauth2/v2/auth', '_blank');
  };

  // Handle clicks outside avatar selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarSelectorRef.current && !avatarSelectorRef.current.contains(event.target as Node)) {
        setShowAvatarSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for logout flag and show toast
  useEffect(() => {
    const justLoggedOut = localStorage.getItem('justLoggedOut');
    if (justLoggedOut === 'true' && showToast) {
      showToast.showInfo('Logged Out', 'You have been logged out successfully. See you soon!');
      localStorage.removeItem('justLoggedOut');
    }
  }, [showToast]);

  // Handle mode change with flip animation
  const handleModeChange = (newMode: 'login' | 'signup') => {
    if (newMode !== mode) {
      setMode(newMode);
      setSignupStep(0); // Reset signup step when switching
    }
  };

  // Signup validation
  const validateSignup = () => {
    const errors: {[key: string]: string} = {};
    if (!signupData.firstName) errors.firstName = 'First name required';
    if (!signupData.lastName) errors.lastName = 'Last name required';
    if (!validateEmail(signupData.email)) errors.email = 'Valid email required';
    if (!validatePhone(signupData.phone)) errors.phone = 'Valid 10-digit phone required';
    if (!validatePassword(signupData.password)) errors.password = 'Password must be 8-15 characters, include uppercase, lowercase, number, and symbol.';
    if (signupData.password !== signupData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!signupData.dob) errors.dob = 'Date of birth required';
    if (!signupData.gender) errors.gender = 'Gender required';
    if (!signupData.address) errors.address = 'Address required';
    if (!signupData.country) errors.country = 'Country required';
    if (!signupData.terms) errors.terms = 'You must accept terms';
    return errors;
  };

  const handleSignupChange = (field: string, value: any) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSignup();
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) {
      triggerShake();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: signupData.email.split('@')[0], // Use email prefix as username
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store authentication token and map backend fields to frontend format
        const userData = {
          id: data.data.user?.id || data.data.id,
          username: data.data.user?.username || data.data.username,
          firstName: data.data.user?.first_name || data.data.first_name || signupData.firstName,
          lastName: data.data.user?.last_name || data.data.last_name || signupData.lastName,
          email: data.data.user?.email || data.data.email || signupData.email,
          phone: data.data.user?.phone || data.data.phone || signupData.phone,
          role: data.data.user?.role || data.data.role || 'customer',
          emailVerified: data.data.user?.emailVerified || data.data.emailVerified || false,
          avatarSvg: getAvatarSvg(avatarSeed),
          token: data.data.token
        };
        
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        setIsLoading(false);
        onAuthSuccess(userData);
      } else {
        setSignupErrors({ email: data.message || 'Registration failed' });
        triggerShake();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSignupErrors({ email: 'Registration failed. Please try again.' });
      triggerShake();
      setIsLoading(false);
    }
  };

  // Validation
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{10}$/.test(phone);
  // Password: 8-15 chars, upper, lower, number, symbol
  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      password.length <= 15 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };
  const validateOTP = (otp: string) => /^\d{6}$/.test(otp);

  // Animation helpers
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const getAvatarSvg = (seed: string) => avatars.createAvatar(style, { seed });
  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strengthEmoji = ['😢', '😐', '🙂', '😃', '🤩', '🔐'];

  // Handlers
  const handleInputChange = (field: string, value: string) => {
    if (field === "identifier") {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData((prev) => ({ ...prev, identifier: value }));
      } else if (!/^\d+$/.test(value)) {
        setFormData((prev) => ({ ...prev, identifier: value }));
      }
    } else if (field === "otp") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 6) {
        setFormData((prev) => ({ ...prev, otp: numericValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let errorObj: {[key: string]: string} = {};
    
    // Check if this is an admin login attempt first
    const isAdminLogin = formData.identifier === 'admin@indianwonderer.com' || formData.identifier === 'admin';
    
    if (!formData.identifier) {
      errorObj.identifier = "Email or phone is required";
    } else if (!isAdminLogin && !validateEmail(formData.identifier) && !validatePhone(formData.identifier)) {
      // Only validate email/phone for non-admin users
      errorObj.identifier = "Enter a valid email or 10-digit phone";
    }
    if (!formData.password) {
      errorObj.password = "Password is required";
    }
    
    // Note: We don't validate password strength for login, only for signup
    // Users might have older passwords that don't meet current requirements
    
    setErrors(errorObj);
    if (Object.keys(errorObj).length > 0) {
      triggerShake();
      return;
    }
    
    setIsLoading(true);
    
    try {
      
      // Check if this is an admin login attempt
      const isEmailLogin = validateEmail(formData.identifier);
      
      if (isAdminLogin) {
        console.log('👑 Attempting admin login...', {
          identifier: formData.identifier,
          isEmailLogin,
          endpoint: `${API_BASE_URL}/admin_login.php`
        });
        
        // Clean request body - only send email OR username, not both
        const adminRequestBody = isEmailLogin 
          ? {
              email: formData.identifier,
              password: formData.password
            }
          : {
              username: formData.identifier,
              password: formData.password
            };
        
        
        // Try admin login with form-encoded data to avoid preflight
        let response;
        try {
          // Create form-encoded data to avoid CORS preflight
          const formDataBody = new URLSearchParams();
          if (isEmailLogin) {
            formDataBody.append('email', formData.identifier);
            formDataBody.append('password', formData.password);
          } else {
            formDataBody.append('username', formData.identifier);
            formDataBody.append('password', formData.password);
          }
          
          console.log('📤 Admin login form data:', formDataBody.toString());
          
          response = await fetch(`${API_BASE_URL}/admin_login.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formDataBody
          });
          
          console.log('📡 Admin API Response received successfully:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
          });
        } catch (fetchError) {
          console.error('🚨 Fetch error occurred:', fetchError);
          throw new Error(`fetch failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('📋 Admin login response data:', data);
        
        if (data.success) {
          console.log('✅ Admin login successful, redirecting to admin panel');
          // Set admin authentication in localStorage for Angular app
          localStorage.setItem('adminAuthenticated', 'true');
          localStorage.setItem('adminData', JSON.stringify(data.data));
          
          console.log('🚀 Redirecting to: http://localhost:4200/dashboard');
          // Redirect to admin panel
          window.location.href = 'http://localhost:4200/dashboard';
          return;
        } else if (response.status === 200) {
          console.log('❌ Admin login failed:', data.message);
          // Admin login failed, show error
          setErrors({ password: data.message || 'Invalid admin credentials' });
          triggerShake();
          setIsLoading(false);
          return;
        }
      }
      
      // Regular user login flow
      console.log('🚀 Attempting regular user login...', {
        endpoint: `${API_BASE_URL}/auth.php?action=login`,
        email: formData.identifier
      });
      
      const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password
        })
      });

      console.log('📡 API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📋 Response data:', data);
      
      if (data.success) {
        console.log('✅ Login successful, storing authentication data');
        
        // Map backend fields to frontend format
        const userData = {
          id: data.data.user?.id || data.data.id,
          username: data.data.user?.username || data.data.username,
          firstName: data.data.user?.first_name || data.data.first_name,
          lastName: data.data.user?.last_name || data.data.last_name,
          email: data.data.user?.email || data.data.email,
          phone: data.data.user?.phone || data.data.phone,
          role: data.data.user?.role || data.data.role,
          emailVerified: data.data.user?.email_verified || data.data.email_verified || false,
          avatarSvg: getAvatarSvg(data.data.user?.username || data.data.username || avatarSeed),
          token: data.data.token
        };
        
        // Store authentication token
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('🎉 Calling onAuthSuccess with user data');
        setIsLoading(false);
        onAuthSuccess(userData);
      } else {
        console.log('❌ Login failed:', data.message);
        setErrors({ password: data.message || 'Invalid credentials' });
        triggerShake();
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('💥 Login error:', error);
      
      // More specific error message
      let errorMessage = 'Login failed. Please try again.';
      if (error instanceof Error) {
        console.error('💥 Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Cross-origin request blocked. Please check server configuration.';
        }
      }
      
      setErrors({ password: errorMessage });
      triggerShake();
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOTP(formData.otp)) {
      setErrors({ otp: "Enter a valid 6-digit OTP" });
      triggerShake();
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess({
        id: Math.random().toString(36).substr(2, 9),
        identifier: formData.identifier,
        avatar: avatarSeed,
        avatarSvg: getAvatarSvg(avatarSeed),
        authLevel: "VERIFIED"
      });
    }, 1200);
  };

  // Theme classes (Cube Factory inspired)
  const theme = dark
    ? {
        bg: "bg-gradient-to-br from-gray-950 via-gray-900 to-black animate-gradient-x",
        card: "bg-gray-900/90 border border-gray-800 shadow-2xl shadow-purple-900/40 backdrop-blur-2xl text-gray-100",
        input: "bg-gray-800/60 border border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-800",
        icon: "text-yellow-400",
        btn: "bg-gradient-to-r from-purple-800 via-indigo-800 to-gray-900 text-white shadow-lg hover:from-purple-900 hover:to-gray-900",
        btn2: "bg-gradient-to-r from-indigo-800 via-purple-800 to-gray-900 text-white shadow-lg hover:from-indigo-900 hover:to-gray-900",
        border: "border-purple-900",
        glass: "backdrop-blur-2xl",
        toggle: "bg-gray-900 border-gray-800 text-yellow-400 hover:bg-gray-800"
      }
    : {
        bg: "bg-gradient-to-br from-orange-300 via-white to-green-300 animate-gradient-x",
        card: "bg-white/90 border border-orange-200 shadow-2xl shadow-green-200/40 backdrop-blur-3xl text-gray-900 ring-2 ring-orange-100",
        input: "bg-white/80 border border-green-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-300",
        icon: "text-blue-500",
  btn: "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white shadow-xl hover:from-blue-600 hover:to-blue-700",
  btn2: "bg-gradient-to-r from-green-500 via-green-400 to-green-600 text-white shadow-xl hover:from-green-600 hover:to-green-700",
        border: "border-orange-200",
        glass: "backdrop-blur-3xl",
        toggle: "bg-white border-green-200 text-green-500 hover:bg-green-50"
      };

  // UI
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
      {/* Dark mode toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setDark((d) => !d)}
          className={`p-3 rounded-full border transition-all duration-300 shadow-lg ${theme.toggle}`}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className={`w-full max-w-md p-0 rounded-3xl shadow-2xl ${theme.card} ${theme.glass} ${theme.border} transition-all duration-500 ${shake ? "animate-shake" : ""} ${mode === 'login' ? 'animate-flip-to-login' : 'animate-flip-to-signup'}`}> 
        {/* Cube Factory Inspired Header */}
        <div className="relative w-full flex flex-col items-center justify-center pt-10 pb-6 px-8">
          {/* Removed top cube logo SVG */}
          {/* WhatsApp.jpg image above company name */}
          <div className="flex justify-center items-center mt-6 mb-1">
            <img src="/WhatsApp.jpg" alt="WhatsApp" className="w-16 h-16 rounded-xl shadow-lg object-cover" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 mt-10 animate-fadeIn" style={{letterSpacing: "-1px", color: dark ? undefined : "#FF9933"}}>Indian Wonderer</h1>
          {/* Removed Travel Cube Factory and vertical gradient line */}
          {/* Impressive message */}
          <div className="text-center mb-4 animate-fadeIn">
            <span className="inline-block text-lg font-semibold bg-gradient-to-r from-orange-500 via-green-500 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
              Unlock your journey. Experience India like never before!
            </span>
          </div>
        </div>
        <div className="px-8 pb-10">
          {/* ...existing code... */}
          <div className="text-center mb-8">
            {/* Removed 'Sign In' and login credential message */}
            {step !== "auth" && (
              <h2 className="text-2xl font-bold mt-2 mb-2 animate-fadeIn">OTP Verification</h2>
            )}
            {step !== "auth" && (
              <p className="opacity-80 animate-fadeIn">{`Enter the 6-digit OTP sent to ${formData.identifier}`}</p>
            )}
          </div>
          {step === "auth" ? (
            <>
              <div className="flex justify-center mb-6">
                <button
                  className={`px-6 py-2 rounded-full font-bold text-base mr-2 transition-all duration-300 ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => handleModeChange('login')}
                  type="button"
                >Login</button>
                <button
                  className={`px-6 py-2 rounded-full font-bold text-base transition-all duration-300 ${mode === 'signup' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => handleModeChange('signup')}
                  type="button"
                >Sign Up</button>
              </div>
              <div>
              {mode === 'login' ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-6 animate-slideIn">
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.icon} w-5 h-5`} />
                      <input
                        type="text"
                        value={formData.identifier}
                        onChange={(e) => handleInputChange("identifier", e.target.value)}
                        className={`w-full pl-10 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${theme.input} ${errors.identifier ? "border-red-400 bg-red-50" : ""}`}
                        placeholder="Email or Phone Number"
                        maxLength={40}
                      />
                      {errors.identifier && (
                        <p className="text-red-500 text-sm mt-1 flex items-center animate-shake">
                          <X className="w-4 h-4 mr-1" />
                          {errors.identifier}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.icon} w-5 h-5`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`w-full pl-10 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${theme.input} ${errors.password ? "border-red-400 bg-red-50" : ""}`}
                        placeholder="Password"
                        maxLength={30}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.icon} hover:text-purple-600 transition-colors duration-300`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1 flex items-center animate-shake">
                          <X className="w-4 h-4 mr-1" />
                          {errors.password}
                        </p>
                      )}
                    </div>
                    
                    {/* Admin Login Hint */}
                    <div className="text-center">
                      <p className="text-xs opacity-60">
                        💡 Admin users: Use <span className="font-mono bg-gray-100 px-1 rounded">admin</span> or <span className="font-mono bg-gray-100 px-1 rounded">admin@indianwonderer.com</span> to access admin panel
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4 rounded-xl font-bold text-lg ${theme.btn} shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                  <div className="flex flex-col items-center justify-center mt-4 animate-fadeIn">
                    <button
                      type="button"
                      className={`w-full max-w-xs py-3 px-4 rounded-xl font-semibold text-base border shadow flex items-center justify-center gap-3 transition-all duration-300 ${
                        dark 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={handleGoogleAuth}
                    >
                      <svg width="22" height="22" viewBox="0 0 48 48" className="inline-block">
                        <g>
                          <path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C35.64 2.36 30.13 0 24 0 14.61 0 6.27 5.74 2.44 14.1l8.06 6.27C12.7 13.13 17.89 9.5 24 9.5z"/>
                          <path fill="#34A853" d="M46.09 24.56c0-1.56-.14-3.06-.39-4.5H24v9.02h12.44c-.54 2.9-2.18 5.36-4.64 7.02l7.18 5.59C43.73 37.36 46.09 31.44 46.09 24.56z"/>
                          <path fill="#FBBC05" d="M10.5 28.37c-.62-1.86-.98-3.84-.98-5.87s.36-4.01.98-5.87l-8.06-6.27C.86 13.61 0 18.64 0 24s.86 10.39 2.44 14.1l8.06-6.27z"/>
                          <path fill="#EA4335" d="M24 48c6.13 0 11.64-2.02 15.82-5.5l-7.18-5.59c-2.01 1.35-4.59 2.15-7.64 2.15-6.11 0-11.3-3.63-13.5-8.87l-8.06 6.27C6.27 42.26 14.61 48 24 48z"/>
                          <path fill="none" d="M0 0h48v48H0z"/>
                        </g>
                      </svg>
                      Continue with Google
                    </button>
                    <span className={`mt-2 text-sm font-medium ${dark ? 'text-green-400' : 'text-green-600'}`}>Sign in or sign up instantly with Google</span>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-4 animate-slideIn">
                  {/* Stepper Progress Bar */}
                  <div className="flex items-center mb-6">
                    {[0,1,2,3].map((stepIdx) => (
                      <div key={stepIdx} className={`flex-1 h-2 mx-1 rounded-full ${signupStep >= stepIdx ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    ))}
                  </div>
                  {/* Motivational Quote */}
                  <div className="text-center text-sm italic text-blue-500 mb-2 animate-fadeIn">{motivationalQuotes[signupStep]}</div>
                  {/* Step 1: Personal Info */}
                  {signupStep === 0 && (
                    <>
                      <div className="flex gap-2">
                        <div className="w-1/2">
                          <label className="block text-sm font-medium mb-1">First Name</label>
                          <input type="text" value={signupData.firstName} onChange={e => handleSignupChange('firstName', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.firstName ? 'border-red-400 bg-red-50' : ''}`} placeholder="Enter first name" />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-sm font-medium mb-1">Last Name</label>
                          <input type="text" value={signupData.lastName} onChange={e => handleSignupChange('lastName', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.lastName ? 'border-red-400 bg-red-50' : ''}`} placeholder="Enter last name" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={signupData.email} onChange={e => handleSignupChange('email', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.email ? 'border-red-400 bg-red-50' : ''}`} placeholder="Enter your email" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone (10 digits)</label>
                        <input type="text" value={signupData.phone} onChange={e => handleSignupChange('phone', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.phone ? 'border-red-400 bg-red-50' : ''}`} maxLength={10} placeholder="Enter 10-digit phone" />
                      </div>
                      {/* Avatar Generator */}
                      <div className="mt-4" ref={avatarSelectorRef}>
                        <label className="block text-sm font-medium mb-2">Choose Your Avatar</label>
                        <div className="flex items-center gap-4 mb-3">
                          <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(avatarSeed) }} className="w-16 h-16 rounded-full border-2 border-orange-400 shadow-lg bg-white" />
                          <div className="flex-1">
                            <button 
                              type="button"
                              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                              className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 ${theme.input} ${showAvatarSelector ? 'border-orange-400 bg-orange-50' : ''} hover:border-orange-300 flex items-center justify-between`}
                            >
                              <span className="capitalize">{avatarOptions.find(opt => opt.seed === avatarSeed)?.name || 'Custom'}</span>
                              <svg className={`w-5 h-5 transition-transform duration-300 ${showAvatarSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {showAvatarSelector && (
                          <div className="grid grid-cols-4 gap-3 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto animate-fadeIn">
                            {avatarOptions.map((option) => (
                              <button
                                key={option.seed}
                                type="button"
                                onClick={() => {
                                  setAvatarSeed(option.seed);
                                  setShowAvatarSelector(false);
                                }}
                                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md ${
                                  avatarSeed === option.seed ? 'bg-orange-100 border-2 border-orange-400' : 'bg-white border border-gray-200'
                                }`}
                              >
                                <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(option.seed) }} className="w-12 h-12 rounded-full border shadow-sm bg-white mb-1" />
                                <span className="text-xs font-medium text-center leading-tight">{option.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <input 
                            type="text" 
                            value={avatarSeed} 
                            onChange={e => setAvatarSeed(e.target.value)} 
                            className={`w-full px-3 py-2 text-sm border rounded-lg ${theme.input}`} 
                            placeholder="Or type custom avatar name..." 
                          />
                          <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'} mt-1 block`}>💡 Try words like "superhero", "ninja", "scientist", or anything creative!</span>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button type="button" className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold" onClick={() => setSignupStep(1)}>Next</button>
                      </div>
                    </>
                  )}
                  {/* Step 2: Security */}
                  {signupStep === 1 && (
                    <>
                      <div className="flex gap-2">
                        <div className="w-1/2 relative">
                          <label className="block text-sm font-medium mb-1">Password</label>
                          <input
                            type={showSignupPassword ? "text" : "password"}
                            value={signupData.password}
                            onChange={e => handleSignupChange('password', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.password ? 'border-red-400 bg-red-50' : ''}`}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
                            onClick={() => setShowSignupPassword(v => !v)}
                          >
                            {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <span className="text-xs text-gray-500">Password must be 8-15 characters, include uppercase, lowercase, number, and symbol.</span>
                          <div className="mt-2 text-lg">Strength: {strengthEmoji[passwordStrength(signupData.password)]}</div>
                        </div>
                        <div className="w-1/2">
                          <label className="block text-sm font-medium mb-1">Confirm Password</label>
                          <input type="password" value={signupData.confirmPassword} onChange={e => handleSignupChange('confirmPassword', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.confirmPassword ? 'border-red-400 bg-red-50' : ''}`} placeholder="Confirm password" />
                        </div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <button type="button" className="px-6 py-2 rounded-xl bg-gray-300 text-gray-700 font-bold" onClick={() => setSignupStep(0)}>Back</button>
                        <button type="button" className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold" onClick={() => setSignupStep(2)}>Next</button>
                      </div>
                    </>
                  )}
                  {/* Step 3: Details */}
                  {signupStep === 2 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input type="date" value={signupData.dob} onChange={e => handleSignupChange('dob', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.dob ? 'border-red-400 bg-red-50' : ''}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <div className="flex gap-4">
                          <button type="button" className={`px-4 py-2 rounded-xl flex items-center gap-2 ${signupData.gender==='male'?'bg-blue-500 text-white':'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} hover:opacity-80 transition-all`} onClick={()=>handleSignupChange('gender','male')}><span>👨</span>Male</button>
                          <button type="button" className={`px-4 py-2 rounded-xl flex items-center gap-2 ${signupData.gender==='female'?'bg-pink-500 text-white':'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} hover:opacity-80 transition-all`} onClick={()=>handleSignupChange('gender','female')}><span>👩</span>Female</button>
                          <button type="button" className={`px-4 py-2 rounded-xl flex items-center gap-2 ${signupData.gender==='other'?'bg-green-500 text-white':'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} hover:opacity-80 transition-all`} onClick={()=>handleSignupChange('gender','other')}><span>🧑</span>Other</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input type="text" value={signupData.address} onChange={e => handleSignupChange('address', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.address ? 'border-red-400 bg-red-50' : ''}`} placeholder="Enter your address" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <div className="flex items-center gap-2">
                          <input type="text" value={signupData.country} onChange={e => handleSignupChange('country', e.target.value)} className={`w-full px-4 py-3 border rounded-xl ${theme.input} ${signupErrors.country ? 'border-red-400 bg-red-50' : ''}`} placeholder="Enter your country" />
                          {signupData.country && <ReactCountryFlag countryCode={signupData.country.slice(0,2).toUpperCase()} svg style={{width:'2em',height:'2em'}} />}
                        </div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <button type="button" className="px-6 py-2 rounded-xl bg-gray-300 text-gray-700 font-bold" onClick={() => setSignupStep(1)}>Back</button>
                        <button type="button" className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold" onClick={() => setSignupStep(3)}>Next</button>
                      </div>
                    </>
                  )}
                  {/* Step 4: Review & Terms */}
                  {signupStep === 3 && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="block text-sm font-medium mb-1">Profile Photo (optional)</label>
                        <input type="file" accept="image/*" onChange={e => handleSignupChange('photo', e.target.files?.[0] || null)} className="" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={signupData.terms} onChange={e => handleSignupChange('terms', e.target.checked)} />
                        <span className={`text-sm font-medium ${signupErrors.terms ? 'text-red-500' : dark ? 'text-gray-200' : 'text-gray-700'}`}>I accept the Terms & Conditions</span>
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-lg font-semibold text-green-600">{motivationalQuotes[Math.floor(Math.random()*motivationalQuotes.length)]}</span>
                      </div>
                      {Object.values(signupErrors).length > 0 && (
                        <div className="text-red-500 text-sm mb-2 animate-shake">
                          {Object.values(signupErrors).map((err, i) => <div key={i}>{err}</div>)}
                        </div>
                      )}
                      <div className="flex justify-between mt-4">
                        <button type="button" className="px-6 py-2 rounded-xl bg-gray-300 text-gray-700 font-bold" onClick={() => setSignupStep(2)}>Back</button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`px-6 py-2 rounded-xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              Sign Up
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
              </div>
            </>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6 animate-slideIn">
              <div className="relative">
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => handleInputChange("otp", e.target.value)}
                  className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 text-center text-2xl font-mono tracking-widest ${theme.input} ${errors.otp ? "border-red-400 bg-red-50" : ""}`}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                {errors.otp && (
                  <p className="text-red-500 text-sm mt-1 flex items-center animate-shake">
                    <X className="w-4 h-4 mr-1" />
                    {errors.otp}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || formData.otp.length !== 6}
                className={`w-full py-4 rounded-xl font-bold text-lg ${theme.btn2} shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("auth")}
                  className="text-purple-500 hover:text-pink-500 text-sm font-medium transition-colors duration-300"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease-in-out infinite;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 2.5s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.7s; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.7s; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce { animation: bounce 1.2s infinite; }
        @keyframes cube-spin {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(20deg) scale(1.08); }
          100% { transform: rotateY(0deg) scale(1); }
        }
        .animate-cube-spin { animation: cube-spin 3s ease-in-out infinite; }
        @keyframes flip {
          0% { transform: perspective(600px) rotateY(0deg); }
          50% { transform: perspective(600px) rotateY(-90deg); }
          100% { transform: perspective(600px) rotateY(0deg); }
        }
        .animate-flip { animation: flip 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default UserAuth;
