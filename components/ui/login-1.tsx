
import React, { useState, useId } from 'react';
import { Mail, Lock, Github, Twitter, Linkedin, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
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
    <div className={`w-full min-w-[200px] relative mb-4 ${className}`}>
      { label && 
        <label htmlFor={inputId} className='block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          id={inputId}
          className="peer relative z-10 border border-[var(--color-border)] h-12 w-full rounded-xl bg-[var(--color-surface)] px-4 pl-10 font-medium text-sm outline-none shadow-sm transition-all duration-200 ease-in-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 text-[var(--color-text-primary)]"
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
                background: `radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 50%)`
            }}
          />
        )}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)] peer-focus:text-indigo-600 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface LoginComponentProps {
  onLogin: () => void;
  onSwitch: () => void;
}

export const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin, onSwitch }) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      if (!email || !password) {
          setError('Please fill in all fields.');
          setIsLoading(false);
          return;
      }

      const result = await authService.login(email, password);

      if (result.success) {
          addToast(`Welcome back, ${result.user?.fullName}`, 'success');
          onLogin();
      } else {
          setError(result.error || 'Login failed');
          addToast(result.error || 'Login failed', 'error');
      }
      setIsLoading(false);
  };

   const socialIcons = [
    { icon: <Github size={20} />, href: '#' },
    { icon: <Twitter size={20} />, href: '#' },
    { icon: <Linkedin size={20} />, href: '#' }
  ];

  return (
    <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4 font-inter text-[var(--color-text-primary)]">
    <div className='card w-full max-w-6xl flex justify-between h-[700px] bg-[var(--color-surface)] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/5 border border-[var(--color-border)]'>
      
      {/* Left Side (Form) */}
      <div
        className='w-full lg:w-1/2 px-8 md:px-16 h-full relative overflow-hidden flex flex-col justify-center'
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
          
          {/* Enhanced Ambient Glow */}
          <div
            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-full blur-[80px] transition-opacity duration-500 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
            }}
          />

          <div className="z-10 w-full max-w-md mx-auto">
            <div className="mb-8">
                <h1 className='text-3xl font-bold text-[var(--color-heading)] tracking-tight'>Welcome Back</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Enter your credentials to access the workspace.</p>
            </div>
            
            <form className='grid gap-2' onSubmit={handleSubmit}>
                <AppInput 
                    id="email"
                    label="Email Address"
                    placeholder="name@company.com" 
                    type="email" 
                    icon={<Mail size={18} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <AppInput 
                    id="password"
                    label="Password"
                    placeholder="Enter your password" 
                    type="password" 
                    icon={<Lock size={18} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                
                {error && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="flex justify-between items-center text-xs mt-2 mb-4">
                    <label className="flex items-center gap-2 text-[var(--color-text-secondary)] cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        Remember me
                    </label>
                    <a href="#" className='font-bold text-indigo-600 hover:underline'>Forgot password?</a>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>
                            Sign In
                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--color-surface)] px-2 text-[var(--color-text-secondary)] font-medium">Or continue with</span>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                {socialIcons.map((social, index) => (
                    <button
                        key={index}
                        className="w-12 h-12 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-2)] hover:text-[var(--color-text-primary)] hover:border-indigo-200 transition-all duration-300"
                    >
                        {social.icon}
                    </button>
                ))}
            </div>

            <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                Don't have an account?{' '}
                <button onClick={onSwitch} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Sign Up
                </button>
            </p>
          </div>
        </div>

        {/* Right Side (Image/Branding) */}
        <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative bg-slate-900'>
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-purple-800/90 z-10 mix-blend-multiply"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10"></div>
             
             <div className="absolute top-12 right-12 z-20">
                 <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                    <div className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
                 </div>
             </div>

             <div className="absolute bottom-12 left-12 z-20 max-w-md">
                 <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Nexus Quantum Ledger.</h2>
                 <p className="text-indigo-100 text-lg font-light leading-relaxed">
                     Experience the next generation of enterprise resource planning. AI-driven insights, real-time auditing, and fluid financial control.
                 </p>
             </div>
            <img
              src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop'
              alt="Abstract 3D"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay hover:scale-105 transition-transform duration-[20s]"
            />
       </div>
      </div>
    </div>
  )
}
