import { Reminder } from '../data/reminders';
import { AppointmentLeadPrefs } from '../data/notifyPrefsContext';
import { cancelById, scheduleAt } from './notifications';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const pad = (n: number) => String(n).padStart(2, '0');
const fmtThaiDateTime = (d: Date) =>
  `${d.getDate()} ${TH_MONTHS[d.getMonth()]} เวลา ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const APPT_LEADS: Array<{ key: keyof AppointmentLeadPrefs; ms: number; label: string }> = [
  { key: 'week', ms: WEEK_MS, label: 'ล่วงหน้า 1 สัปดาห์' },
  { key: 'day', ms: DAY_MS, label: 'ล่วงหน้า 1 วัน' },
  { key: 'hour', ms: HOUR_MS, label: 'ล่วงหน้า 1 ชั่วโมง' },
];

const VACCINE_LEAD_MS = 7 * DAY_MS;
const TREATMENT_LEAD_MS = DAY_MS;

const apptId = (reminderId: string, lead: keyof AppointmentLeadPrefs) =>
  `appt-${reminderId}-${lead}`;
const vaccineId = (reminderId: string) => `vacc-${reminderId}`;
const treatmentId = (reminderId: string) => `treat-${reminderId}`;

/**
 * Cancel + reschedule one-shot reminder notifications based on the user's
 * current prefs. Idempotent: existing identifiers are cancelled before
 * scheduling, and disabled toggles cancel without rescheduling.
 *
 * Skips events that are already in the past — iOS rejects DATE triggers in
 * the past anyway, so there's nothing useful to do for them.
 */
export async function syncReminderNotifications(
  reminders: Reminder[],
  prefs: {
    preAppointment: AppointmentLeadPrefs;
    preVaccine: boolean;
    preTreatment: boolean;
  },
): Promise<void> {
  const now = Date.now();

  await Promise.all(
    reminders.map(async (r) => {
      const due = new Date(r.dueISO);
      const dueMs = due.getTime();
      const petLine = r.petName ? `${r.petName} · ` : '';

      if (r.type === 'appointment') {
        await Promise.all(
          APPT_LEADS.map(async ({ key, ms, label }) => {
            const id = apptId(r.id, key);
            const fireMs = dueMs - ms;
            if (!prefs.preAppointment[key] || fireMs <= now) {
              await cancelById(id);
              return;
            }
            await scheduleAt({
              date: new Date(fireMs),
              identifier: id,
              title: `${label} — ${r.title}`,
              body: `${petLine}${fmtThaiDateTime(due)}`,
              data: { kind: 'appointment', reminderId: r.id, lead: key },
            });
          }),
        );
        return;
      }

      if (r.type === 'vaccine') {
        const id = vaccineId(r.id);
        const fireMs = dueMs - VACCINE_LEAD_MS;
        if (!prefs.preVaccine || fireMs <= now) {
          await cancelById(id);
          return;
        }
        await scheduleAt({
          date: new Date(fireMs),
          identifier: id,
          title: `วัคซีนใกล้ครบกำหนด`,
          body: `${petLine}${r.title}`,
          data: { kind: 'vaccine', reminderId: r.id },
        });
        return;
      }

      if (r.type === 'medication') {
        const id = treatmentId(r.id);
        const fireMs = dueMs - TREATMENT_LEAD_MS;
        if (!prefs.preTreatment || fireMs <= now) {
          await cancelById(id);
          return;
        }
        await scheduleAt({
          date: new Date(fireMs),
          identifier: id,
          title: `ใกล้เวลาให้ยา`,
          body: `${petLine}${r.title}`,
          data: { kind: 'medication', reminderId: r.id },
        });
        return;
      }
    }),
  );
}
