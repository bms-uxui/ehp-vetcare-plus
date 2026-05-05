import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appointment, mockAppointments } from './appointments';
import { cancelById, scheduleAt } from '../lib/notifications';
import {
  appointmentReminderId,
  appointmentStartDate,
  APPT_REMINDER_MIN,
} from '../lib/appointmentTime';

type AppointmentsContextValue = {
  appointments: Appointment[];
  cancelAppointment: (id: string) => void;
  updateAppointment: (id: string, patch: Partial<Omit<Appointment, 'id'>>) => void;
};

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

/** Schedule the -15 min reminder for a single upcoming appointment.
 *  Safely no-ops if the firing time is already in the past. */
async function scheduleReminderFor(a: Appointment) {
  if (a.status !== 'upcoming') return;
  const fire = new Date(appointmentStartDate(a).getTime() - APPT_REMINDER_MIN * 60_000);
  if (fire.getTime() <= Date.now()) return;
  const isOnline = a.type === 'consultation';
  const title = `อีก ${APPT_REMINDER_MIN} นาที ${a.typeLabel}`;
  const body = isOnline
    ? `ใกล้ถึงเวลาวิดีโอคอลกับ ${a.vetName} เปิดแอปและเตรียมน้อง${a.petName}ไว้ใกล้ๆ ได้เลย`
    : `ใกล้ถึงเวลานัดที่ ${a.clinicName} กับ ${a.vetName} เตรียมตัวเดินทางได้เลย`;
  await scheduleAt({
    date: fire,
    title,
    body,
    identifier: appointmentReminderId(a.id),
    data: { appointmentId: a.id, kind: 'appointment-reminder' },
  });
}

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(() => [
    ...mockAppointments,
  ]);

  // Schedule -15 min reminders once at provider mount for all upcoming
  // appointments. Subsequent edits go through cancel/update below.
  useEffect(() => {
    appointments.forEach((a) => {
      if (a.status === 'upcoming') void scheduleReminderFor(a);
    });
    // Intentionally only run once — `appointments` mutations are handled by
    // the explicit cancel/update callbacks so we don't re-schedule the world
    // on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
    );
    void cancelById(appointmentReminderId(id));
  }, []);

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Omit<Appointment, 'id'>>) => {
      setAppointments((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
        // Reschedule reminder against the patched record (handles time change,
        // status flip, etc.). cancelById is implicit inside scheduleAt.
        const updated = next.find((a) => a.id === id);
        if (updated) {
          if (updated.status === 'upcoming') {
            void scheduleReminderFor(updated);
          } else {
            void cancelById(appointmentReminderId(id));
          }
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<AppointmentsContextValue>(
    () => ({ appointments, cancelAppointment, updateAppointment }),
    [appointments, cancelAppointment, updateAppointment],
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments(): AppointmentsContextValue {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error('useAppointments must be used within AppointmentsProvider');
  return ctx;
}
