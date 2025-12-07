
import React, { useState, useId } from 'react';
import { Mail, Lock, User, Github, Twitter, Linkedin, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from './Toast';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  id?: string;
  type?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const AppInput = ({ label, placeholder, icon, id, className, ...rest }: InputProps & { className?: string }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className={`w-full min-w-[200px] relative mb-1 ${className}`}>
      { label && 
        <label htmlFor={inputId} className='block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          id={inputId}
          className="peer relative z-10 border border-[var(--color-border)] h-12 w-full rounded-xl bg-[var(--color-surface)] px-4 pl-10 font-medium text-sm outline-none shadow-sm transition-all duration-200 ease-in-out focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-400 text-[var(--color-text-primary)]"
          placeholder={placeholder}
          aria-label={label || placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-20"
            style={{
                background: `radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.15), transparent 50%)`
            }}
          />
        )}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)] peer-focus:text-emerald-600 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface SignupComponentProps {
  onSignup: () => void;
  onSwitch: () => void;
}

export const SignupComponent: React.FC<SignupComponentProps> = ({ onSignup, onSwitch }) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      // Validation
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('All fields are required.');
          setIsLoading(false);
          return;
      }

      if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
      }

      if (formData.password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
      }

      const result = await authService.signup(formData.fullName, formData.email, formData.password);

      if (result.success) {
          addToast('Account created successfully! Redirecting...', 'success');
          onSignup();
      } else {
          setError(result.error || 'Signup failed');
          addToast(result.error || 'Signup failed', 'error');
      }
      setIsLoading(false);
  };

  return (
    <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4 font-inter text-[var(--color-text-primary)]">
    <div className='card w-full max-w-6xl flex justify-between h-[700px] bg-[var(--color-surface)] rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/5 border border-[var(--color-border)]'>
      
      {/* Left Side (Image) */}
      <div className='hidden lg:block w-1/2 left h-full overflow-hidden relative bg-slate-900'>
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-800/90 z-10 mix-blend-multiply"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10 z-10"></div>
             
             <div className="absolute top-12 left-12 z-20">
                 <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-400/30">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                 </div>
             </div>

             <div className="absolute bottom-12 left-12 z-20 max-w-md">
                 <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Join the Future of Finance.</h2>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-emerald-100">
                        <CheckCircle size={18} className="text-emerald-400" /> <span>Automated Ledger Reconciliation</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-100">
                        <CheckCircle size={18} className="text-emerald-400" /> <span>AI-Driven Compliance Checks</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-100">
                        <CheckCircle size={18} className="text-emerald-400" /> <span>Real-time Multi-Currency</span>
                    </div>
                 </div>
             </div>
            <img
              src='https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
              alt="Background"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay hover:scale-105 transition-transform duration-[20s]"
            />
       </div>

      {/* Right Side (Form) */}
      <div
        className='w-full lg:w-1/2 px-8 md:px-16 h-full relative overflow-hidden flex flex-col justify-center'
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
          
          {/* Enhanced Ambient Glow */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full blur-[80px] transition-opacity duration-500 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
            }}
          />

          <div className="z-10 w-full max-w-md mx-auto">
            <div className="mb-8">
                <h1 className='text-3xl font-bold text-[var(--color-heading)] tracking-tight'>Create Account</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Get started with your 14-day free trial. No credit card required.</p>
            </div>
            
            <form className='grid gap-4' onSubmit={handleSubmit}>
                <AppInput 
                    id="fullName"
                    label="Full Name"
                    placeholder="John Doe" 
                    type="text" 
                    icon={<User size={18} />}
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
                <AppInput 
                    id="email"
                    label="Work Email"
                    placeholder="john@company.com" 
                    type="email" 
                    icon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AppInput 
                        id="password"
                        label="Password"
                        placeholder="••••••••" 
                        type="password" 
                        icon={<Lock size={18} />}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <AppInput 
                        id="confirmPassword"
                        label="Confirm"
                        placeholder="••••••••" 
                        type="password" 
                        icon={<CheckCircle size={18} />}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="text-xs text-[var(--color-text-secondary)] bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    By registering, you agree to our <a href="#" className="text-emerald-600 font-medium hover:underline">Terms of Service</a> & <a href="#" className="text-emerald-600 font-medium hover:underline">Privacy Policy</a>.
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>
                            Create Account
                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                Already have an account?{' '}
                <button onClick={onSwitch} className="font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                    Sign In
                </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
