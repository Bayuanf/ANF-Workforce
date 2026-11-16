export const WORK_SCHEDULE = {
  START_TIME: "08:00",
  END_TIME: "17:00",
  BREAK_START: "12:00",
  BREAK_END: "13:00",
  TOLERANCE_MINUTES: 10, // S/d 08:10 tepat waktu, 08:11 ke atas terlambat
  EFFECTIVE_HOURS_PER_DAY: 8,
  WORK_DAYS_PER_WEEK: 5,
};

export const ROLES = {
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export const ATTENDANCE_STATUS = {
  ON_TIME: "ON_TIME",
  LATE: "LATE",
  INCOMPLETE: "INCOMPLETE",
  ABSENT: "ABSENT",
} as const;

export const LATENESS_DECISIONS = {
  EXCUSED: "Izin Diterima (Alasan Mendesak/Cuaca)",
  WARNING: "Teguran Lisan / Pengingat",
  UNEXCUSED: "Tanpa Alasan Sah",
  OTHER: "Lainnya (Perlu Koordinasi Atasan)",
} as const;

export const LEAVE_TYPES = {
  ANNUAL_LEAVE: "Cuti Tahunan",
  SICK: "Sakit (Surat Dokter)",
  PERMISSION: "Izin Keperluan Pribadi",
  OTHER: "Lainnya",
} as const;

export const REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
