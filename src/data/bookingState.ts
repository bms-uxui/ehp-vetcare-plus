// Module-level flag to bypass BookAppointmentScreen's "leave?" confirmation
// when the user has just confirmed the booking on the Summary screen.
// The Summary screen sets this to true before popping back; BookAppointment's
// beforeRemove listener consumes it.
export const bookingSubmitted = { current: false };
