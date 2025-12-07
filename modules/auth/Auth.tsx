import React from 'react';
import { LoginComponent } from '../../components/ui/login-1';
import { SignupComponent } from '../../components/ui/signup-1';

interface AuthProps {
    onLogin: () => void;
    onSwitch: () => void;
}

export const LoginPage: React.FC<AuthProps> = ({ onLogin, onSwitch }) => {
    return <LoginComponent onLogin={onLogin} onSwitch={onSwitch} />;
};

export const SignupPage: React.FC<AuthProps> = ({ onLogin, onSwitch }) => {
    return <SignupComponent onSignup={onLogin} onSwitch={onSwitch} />;
};
