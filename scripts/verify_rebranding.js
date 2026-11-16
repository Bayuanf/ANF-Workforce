const fs = require("fs");
const path = require("path");

function testRebranding() {
  console.log("==================================================");
  console.log("   VERIFIKASI PRD REVISI: ANF WORKFORCE REBRAND   ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Periksa file login page
  const loginCode = fs.readFileSync(path.join(__dirname, "..", "src", "app", "login", "page.tsx"), "utf8");

  // Identitas Utama
  assert(loginCode.includes("PT ANF GROUP"), "1. Memuat teks 'PT ANF GROUP'");
  assert(loginCode.includes("ANF Workforce"), "2. Memuat nama sistem 'ANF Workforce'");
  assert(loginCode.includes("Human Resource Management System"), "3. Memuat deskripsi 'Human Resource Management System'");

  // Tidak ada logo di sisi kiri
  // Sisi kiri tidak boleh me-render BrandLogo
  const leftSidePart = loginCode.split("SISI KIRI:")[1]?.split("SISI KANAN:")[0] || "";
  assert(!leftSidePart.includes("<BrandLogo"), "4. Logo ANF pada sisi kiri halaman login telah dihapus");

  // Footer
  assert(loginCode.includes("© 2026 PT ANF Group. Hak Cipta Dilindungi."), "5. Footer menggunakan teks '© 2026 PT ANF Group. Hak Cipta Dilindungi.'");

  // Tiga fitur panjang dihapus
  assert(!loginCode.includes("Pencatatan Kehadiran & Toleransi Terukur"), "6. Fitur panjang 'Pencatatan Kehadiran' telah dihapus");
  assert(!loginCode.includes("Alur Persetujuan & Jejak Transparan"), "7. Fitur panjang 'Alur Persetujuan' telah dihapus");
  assert(!loginCode.includes("Keamanan Berbasis Peran (RBAC)"), "8. Fitur panjang 'Keamanan Berbasis Peran' telah dihapus");

  // Animasi Background Sisi Kiri
  assert(loginCode.includes("animate-float-subtle"), "9. Poligon geometris memiliki class 'animate-float-subtle'");
  assert(loginCode.includes("animate-pulse-soft"), "10. Titik geometris memiliki class 'animate-pulse-soft'");
  assert(loginCode.includes("animate-rotate-slow"), "11. Concentric arcs memiliki class 'animate-rotate-slow'");
  assert(loginCode.includes("animate-ambient-drift"), "12. Ambient glow memiliki class 'animate-ambient-drift'");

  // Fitur password show/hide
  assert(loginCode.includes("Eye") && loginCode.includes("EyeOff") && loginCode.includes("showPassword"), "13. Fitur show/hide password dengan ikon mata tetap tersedia dan berfungsi");

  // 2. Periksa globals.css untuk keyframes dan prefers-reduced-motion
  const cssCode = fs.readFileSync(path.join(__dirname, "..", "src", "app", "globals.css"), "utf8");
  assert(cssCode.includes("@keyframes float-subtle"), "14. CSS memuat keyframe float-subtle");
  assert(cssCode.includes("@keyframes pulse-soft"), "15. CSS memuat keyframe pulse-soft");
  assert(cssCode.includes("@keyframes rotate-slow"), "16. CSS memuat keyframe rotate-slow");
  assert(cssCode.includes("@keyframes ambient-drift"), "17. CSS memuat keyframe ambient-drift");
  assert(cssCode.includes("prefers-reduced-motion: reduce"), "18. Mendukung aksesibilitas prefers-reduced-motion: reduce");

  // 3. Periksa seluruh codebase src untuk memastikan tidak ada lagi 'ANF HR'
  const appLayoutCode = fs.readFileSync(path.join(__dirname, "..", "src", "components", "layout", "AppLayout.tsx"), "utf8");
  assert(!appLayoutCode.includes("ANF HR"), "19. AppLayout tidak memuat teks 'ANF HR'");
  assert(appLayoutCode.includes("ANF Workforce"), "20. AppLayout memuat nama 'ANF Workforce'");

  console.log("\n==================================================");
  console.log(`HASIL VERIFIKASI: ${passed} PASS, ${failed} FAIL`);
  console.log("==================================================");

  if (failed === 0) {
    console.log("SELURUH KETENTUAN PRD REVISI TERPENUHI 100%!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testRebranding();
