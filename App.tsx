
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { UtilityModule } from './modules/utility/UtilityModule';
import { JournalModule } from './modules/journal/JournalModule';
import { GeneralLedgerModule } from './modules/gl/GeneralLedgerModule';
import { Dashboard } from './modules/dashboard/Dashboard';
import { LoginPage, SignupPage } from './modules/auth/Auth';
import { SuperAdminDashboard } from './modules/admin/SuperAdminDashboard';
import { Onboarding } from './modules/auth/Onboarding';
import { ToastProvider } from './components/ui/Toast';
import { authService } from './services/authService';
import { Role } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [userRole, setUserRole] = useState<Role | null>(null);
  
  // Onboarding State
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  
  // Sub-context for deep linking
  const [subContext, setSubContext] = useState<string | undefined>(undefined);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check for Onboarding Token in URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
          setOnboardingToken(token);
          return;
      }

      // 2. Check Session
      const user = await authService.getSession();
      if (user) {
        setIsAuthenticated(true);
        setUserRole(user.role);
        // Redirect Super Admin to companies by default if on dashboard
        if (user.role === Role.SUPER_ADMIN && activeModule === 'dashboard') {
            setActiveModule('companies');
        }
      }
    };

    initializeAuth();
  }, []);

  const handleNavigate = (module: string, tab?: string) => {
      setActiveModule(module);
      if (tab) setSubContext(tab);
  };

  const handleLogout = () => {
      authService.logout();
      setIsAuthenticated(false);
      setUserRole(null);
      setAuthView('login');
      setActiveModule('dashboard');
  };

  // Onboarding Flow
  if (onboardingToken) {
      return (
          <ToastProvider>
              <Onboarding 
                token={onboardingToken} 
                onComplete={async () => {
                    // Remove query param
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setOnboardingToken(null);
                    // Refresh session
                    const user = await authService.getSession();
                    if(user) {
                        setIsAuthenticated(true);
                        setUserRole(user.role);
                    }
                }} 
              />
          </ToastProvider>
      );
  }

  // Standard App Routing
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'companies':
        return <SuperAdminDashboard />;
      case 'utility':
        return <UtilityModule initialTab={subContext} />;
      case 'journals':
        return <JournalModule initialTab={subContext} />;
      case 'gl':
        return <GeneralLedgerModule />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
             <div className="text-6xl mb-4 opacity-20">🚧</div>
             <h2 className="text-2xl font-bold text-slate-600">Module Under Construction</h2>
             <p className="text-slate-500 mt-2">The <span className="font-mono text-indigo-500">{activeModule}</span> module is coming in the next sprint.</p>
          </div>
        );
    }
  };

  const AuthScreens = () => {
      if (!isAuthenticated) {
        if (authView === 'login') {
          return (
            <LoginPage 
              onLogin={async () => {
                  setIsAuthenticated(true);
                  const user = await authService.getSession();
                  if(user) {
                      setUserRole(user.role);
                      if (user.role === Role.SUPER_ADMIN) setActiveModule('companies');
                  }
              }} 
              onSwitch={() => setAuthView('signup')} 
            />
          );
        } else {
          return (
            <SignupPage 
              onLogin={async () => {
                  setIsAuthenticated(true);
                  const user = await authService.getSession();
                  if(user) setUserRole(user.role);
              }} 
              onSwitch={() => setAuthView('login')} 
            />
          );
        }
      }
      return null;
  };

  return (
    <ToastProvider>
        {!isAuthenticated ? (
            <AuthScreens />
        ) : (
            <Layout 
              activeModule={activeModule} 
              setActiveModule={setActiveModule}
              onLogout={handleLogout}
              userRole={userRole}
            >
              {renderContent()}
            </Layout>
        )}
    </ToastProvider>
  );
}

export default App;
