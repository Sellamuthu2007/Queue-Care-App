import React, { createContext, useContext, useState } from 'react';

export type ScreenName =
  | 'Home'
  | 'HospitalDetails'
  | 'DoctorDetails'
  | 'BookingForm'
  | 'BookingSuccess'
  | 'AppointmentDetails';

interface NavigationContextType {
  currentScreen: ScreenName;
  screenParams: any;
  history: ScreenName[];
  paramsHistory: any[];
  navigate: (screen: ScreenName, params?: any) => void;
  goBack: () => void;
  resetToHome: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [screenParams, setScreenParams] = useState<any>({});
  const [history, setHistory] = useState<ScreenName[]>(['Home']);
  const [paramsHistory, setParamsHistory] = useState<any[]>([{}]);

  const navigate = (screen: ScreenName, params: any = {}) => {
    setCurrentScreen(screen);
    setScreenParams(params);
    setHistory((prev) => [...prev, screen]);
    setParamsHistory((prev) => [...prev, params]);
  };

  const goBack = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const newParamsHistory = paramsHistory.slice(0, -1);
    setHistory(newHistory);
    setParamsHistory(newParamsHistory);
    setCurrentScreen(newHistory[newHistory.length - 1]);
    setScreenParams(newParamsHistory[newParamsHistory.length - 1]);
  };

  const resetToHome = () => {
    setCurrentScreen('Home');
    setScreenParams({});
    setHistory(['Home']);
    setParamsHistory([{}]);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        screenParams,
        history,
        paramsHistory,
        navigate,
        goBack,
        resetToHome,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
};
