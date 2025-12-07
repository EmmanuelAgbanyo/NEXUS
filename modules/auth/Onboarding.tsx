
import React, { useState, useEffect } from 'react';
import { ModernInput } from '../../components/ui/ModernInput';
import { Button } from '../../components/ui/UtilityComponents';
import { authService } from '../../services/authService';
import { OnboardingToken } from '../../types';
import { Loader2, ShieldCheck, CheckCircle, ArrowRight, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const Onboarding: React.FC<{ token: string; onComplete: () => void }> = ({ token, onComplete }) => {
    const [step, setStep] = useState<'validating' | 'verify' | 'setup' | 'success'>('validating');
    const [tokenData, setTokenData] = useState<OnboardingToken | null>(null);
    const [error, setError] = useState('');
    
    // Forms
    const [verifyEmail, setVerifyEmail] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        const result = await authService.validateOnboardingToken(token);
        if (result.valid && result.data) {
            setTokenData(result.data);
            setStep('verify');
        } else {
            setError(result.error || 'Invalid or expired onboarding link.');
        }
    };

    const handleVerify = () => {
        if (!tokenData) return;
        if (verifyEmail.toLowerCase() !== tokenData.email.toLowerCase() || verifyPassword !== tokenData.tempPasswordRaw) {
            setError('Invalid temporary credentials. Please check the details provided by your administrator.');
            return;
        }
        setError('');
        setStep('setup');
    };

    const handleSetup = async () => {
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!fullName) {
            setError('Full Name is required.');
            return;
        }

        setIsSubmitting(true);
        const result = await authService.completeOnboarding(token, newPassword, fullName);
        if (result.success) {
            setStep('success');
            setTimeout(onComplete, 2000); // Auto redirect
        } else {
            setError(result.error || 'Setup failed.');
            setIsSubmitting(false);
        }
    };

    if (error && step === 'validating') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-t-4 border-red-500">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
                {step === 'validating' && (
                    <div className="p-12 text-center">
                        <Loader2 className="animate-spin w-12 h-12 text-indigo-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Verifying Secure Token...</h3>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="p-8 md:p-12">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Security Verification</h2>
                            <p className="text-slate-500 text-sm mt-2">Enter the temporary credentials provided in your invitation.</p>
                        </div>

                        <div className="space-y-4">
                            <ModernInput 
                                label="Temporary Email" 
                                value={verifyEmail} 
                                onChange={e => setVerifyEmail(e.target.value)} 
                            />
                            <ModernInput 
                                label="Temporary Password" 
                                type="password" 
                                value={verifyPassword} 
                                onChange={e => setVerifyPassword(e.target.value)} 
                            />
                            {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
                            <Button onClick={handleVerify} className="w-full py-4 text-base mt-4 shadow-lg shadow-indigo-200">
                                Verify Identity <ArrowRight size={16} className="ml-2"/>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'setup' && (
                    <div className="p-8 md:p-12">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Setup Admin Profile</h2>
                            <p className="text-slate-500 text-sm mt-2">Create your permanent credentials to access the system.</p>
                        </div>

                        <div className="space-y-4">
                            <ModernInput 
                                label="Full Name" 
                                icon={<User size={18}/>}
                                value={fullName} 
                                onChange={e => setFullName(e.target.value)} 
                            />
                            <div className="h-px bg-slate-100 my-4"></div>
                            <ModernInput 
                                label="New Password" 
                                type="password" 
                                icon={<Lock size={18}/>}
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                            />
                            <ModernInput 
                                label="Confirm Password" 
                                type="password" 
                                icon={<CheckCircle size={18}/>}
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                            />
                            {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
                            <Button onClick={handleSetup} disabled={isSubmitting} className="w-full py-4 text-base mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                                {isSubmitting ? <Loader2 className="animate-spin"/> : 'Complete Setup'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-12 text-center bg-emerald-50 h-full">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm animate-bounce">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-900 mb-2">Welcome to Nexus!</h2>
                        <p className="text-emerald-700 mb-8">Your account has been fully provisioned. Redirecting you to the dashboard...</p>
                        <Loader2 className="animate-spin w-6 h-6 text-emerald-600 mx-auto" />
                    </div>
                )}
            </motion.div>
        </div>
    );
};
