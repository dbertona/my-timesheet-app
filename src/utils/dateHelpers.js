export function formatDate(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function parseDate(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split("/");
  if (!dd || !mm || !yyyy) return null;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
}

// Helpers comunes de formato/parseo ISO <-> display
export function toIsoFromInput(value) {
  if (!value) return null;
  if (typeof value === "string" && value.includes("/")) {
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(value).slice(0, 10);
}

export function toDisplayDate(value) {
  if (!value) return "";
  const s = String(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const iso = s.slice(0, 10);
  const [y, m, d] = iso.split("-");
  if (y && m && d) {
    try {
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return "";
    }
  }
  return "";
}
