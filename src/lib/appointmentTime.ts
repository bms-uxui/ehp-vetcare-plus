import { Appointment } from '../data/appointments';

/** Minutes before appointment start when the "เตรียมตัว" notification fires
 *  and the in-app countdown preview begins. */
export const APPT_REMINDER_MIN = 15;

export function appointmentStartDate(a: Pick<Appointment, 'dateISO' | 'time'>): Date {
  const [hh, mm] = a.time.split(':').map(Number);
  const d = new Date(a.dateISO);
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function appointmentEndDate(
  a: Pick<Appointment, 'dateISO' | 'time' | 'durationMin'>,
): Date {
  const start = appointmentStartDate(a);
  return new Date(start.getTime() + a.durationMin * 60_000);
}

/** True if `now` falls between appointment start and end — i.e. the call
 *  may actually be placed. The 15-min pre-window does NOT enable the call;
 *  it only triggers the reminder notification + countdown preview. */
export function isVideoCallActive(
  a: Pick<Appointment, 'dateISO' | 'time' | 'durationMin'>,
  nowMs: number,
): boolean {
  const start = appointmentStartDate(a).getTime();
  const end = start + a.durationMin * 60_000;
  return nowMs >= start && nowMs < end;
}

/** True if `now` is inside the pre-call countdown window (≤ APPT_REMINDER_MIN
 *  before start, but not yet started). Used to show "เริ่มได้ในอีก MM:SS" on
 *  a disabled button so users see the appointment is imminent. */
export function isVideoCallPreview(
  a: Pick<Appointment, 'dateISO' | 'time'>,
  nowMs: number,
): boolean {
  const start = appointmentStartDate(a).getTime();
  const remaining = start - nowMs;
  return remaining > 0 && remaining <= APPT_REMINDER_MIN * 60_000;
}

/** Format remaining ms as "MM:SS" — for the countdown preview label. */
export function formatRemaining(remainingMs: number): string {
  const safe = Math.max(0, remainingMs);
  const m = String(Math.floor(safe / 60_000)).padStart(2, '0');
  const s = String(Math.floor((safe % 60_000) / 1000)).padStart(2, '0');
  return `${m}:${s}`;
}

/** Stable identifier for the per-appointment local notification — letting
 *  us cancel + reschedule on update/cancel. */
export function appointmentReminderId(appointmentId: string): string {
  return `appt-reminder-${appointmentId}`;
}
