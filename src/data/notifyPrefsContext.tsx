import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AppointmentLeadPrefs = {
  week: boolean;
  day: boolean;
  hour: boolean;
};

type NotifyPrefsContextValue = {
  preAppointment: AppointmentLeadPrefs;
  setPreAppointment: (v: AppointmentLeadPrefs) => void;
  preVaccine: boolean;
  setPreVaccine: (v: boolean) => void;
  preTreatment: boolean;
  setPreTreatment: (v: boolean) => void;
};

const NotifyPrefsContext = createContext<NotifyPrefsContextValue | null>(null);

export function NotifyPrefsProvider({ children }: { children: ReactNode }) {
  const [preAppointment, setPreAppointment] = useState<AppointmentLeadPrefs>({
    week: true,
    day: true,
    hour: true,
  });
  const [preVaccine, setPreVaccine] = useState(true);
  const [preTreatment, setPreTreatment] = useState(true);

  const value = useMemo<NotifyPrefsContextValue>(
    () => ({
      preAppointment,
      setPreAppointment,
      preVaccine,
      setPreVaccine,
      preTreatment,
      setPreTreatment,
    }),
    [preAppointment, preVaccine, preTreatment],
  );

  return (
    <NotifyPrefsContext.Provider value={value}>
      {children}
    </NotifyPrefsContext.Provider>
  );
}

export function useNotifyPrefs(): NotifyPrefsContextValue {
  const ctx = useContext(NotifyPrefsContext);
  if (!ctx)
    throw new Error('useNotifyPrefs must be used within NotifyPrefsProvider');
  return ctx;
}
