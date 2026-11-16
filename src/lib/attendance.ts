export interface AttendanceCalculationResult {
  status: "ON_TIME" | "LATE" | "INCOMPLETE";
  checkIn: Date | null;
  checkOut: Date | null;
  workHours: number | null;
  isLate: boolean;
  lateMinutes: number;
}

/**
 * Memproses scan time mentah karyawan dalam satu hari menjadi Check In dan Check Out
 * Aturan:
 * - Scan pertama hari itu dianggap Check In.
 * - Scan terakhir hari itu dianggap Check Out (jika terdapat lebih dari 1 scan dan berjarak wajar).
 * - Jika hanya 1 scan, tandai INCOMPLETE.
 */
export function calculateAttendance(scanTimes: Date[]): AttendanceCalculationResult {
  if (!scanTimes || scanTimes.length === 0) {
    return {
      status: "INCOMPLETE",
      checkIn: null,
      checkOut: null,
      workHours: null,
      isLate: false,
      lateMinutes: 0,
    };
  }

  // Urutkan scan time dari paling pagi ke paling sore
  const sorted = [...scanTimes].sort((a, b) => a.getTime() - b.getTime());
  const checkIn = sorted[0];
  const checkOut = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  // Cek jam dan menit checkIn
  // Jadwal masuk: 08:00, toleransi 10 menit -> 08:10 adalah batas akhir tepat waktu.
  // 08:11 ke atas = LATE
  const inHours = checkIn.getHours();
  const inMinutes = checkIn.getMinutes();
  const inTotalMinutes = inHours * 60 + inMinutes;

  const targetMinutes = 8 * 60; // 08:00 = 480 menit
  const lateThreshold = 8 * 60 + 10; // 08:10 = 490 menit

  const isLate = inTotalMinutes > lateThreshold;
  const lateMinutes = isLate ? inTotalMinutes - targetMinutes : 0;

  let workHours: number | null = null;
  if (checkOut) {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    let hours = diffMs / (1000 * 60 * 60);

    // Pengurangan 1 jam istirahat jika melewati rentang istirahat 12.00-13.00
    if (inHours < 12 && checkOut.getHours() >= 13) {
      hours = Math.max(0, hours - 1);
    }
    workHours = Math.round(hours * 10) / 10;
  }

  let status: "ON_TIME" | "LATE" | "INCOMPLETE" = "ON_TIME";
  if (!checkOut) {
    status = "INCOMPLETE";
  } else if (isLate) {
    status = "LATE";
  }

  return {
    status,
    checkIn,
    checkOut,
    workHours,
    isLate,
    lateMinutes,
  };
}
