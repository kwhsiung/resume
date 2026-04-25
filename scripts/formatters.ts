const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseMonthYear(s: string): { year: number; month: number } {
  const [mon, year] = s.trim().split(/\s+/);
  if (!(mon in MONTHS) || !/^\d{4}$/.test(year ?? "")) {
    throw new Error(`Cannot parse "${s}" as "MMM YYYY"`);
  }
  return { year: parseInt(year, 10), month: MONTHS[mon] };
}

export function formatDuration(start: string, end: string): string {
  const a = parseMonthYear(start);
  const b = parseMonthYear(end);
  const total = (b.year - a.year) * 12 + (b.month - a.month) + 1;
  if (total <= 0) throw new Error(`End date "${end}" is before start "${start}"`);
  const yrs = Math.floor(total / 12);
  const mos = total % 12;
  if (yrs === 0) return `${mos} mos`;
  if (mos === 0) return yrs === 1 ? `${yrs} yr` : `${yrs} yrs`;
  return `${yrs} ${yrs === 1 ? "yr" : "yrs"} ${mos} mos`;
}

export function formatDateRange(start: string, end: string): string {
  return `${start} - ${end} (${formatDuration(start, end)})`;
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("886")) {
    const local = digits.slice(3);
    return `+886 ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return raw;
}

export function formatLocation(location: string | undefined, locationType: string | undefined): string {
  if (!location) return "";
  const parts = location.split(",").map((s) => s.trim());
  const collapsed = parts.length === 3 ? `${parts[0]}, ${parts[2]}` : parts.join(", ");
  return locationType ? `${collapsed} (${locationType})` : collapsed;
}

export function formatDegree(degree: string): string {
  const m = degree.match(/^(.+?) - [A-Z]+, (.+)$/);
  return m ? `${m[1]} in ${m[2]}` : degree;
}

export function formatLinkText(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Convert a raw markdown-ish string to safe inline HTML.
 * Order matters: handle markdown links first (they contain `(` `)` and URLs),
 * then bare URLs in remaining text, then escape everything else.
 */
export function renderInline(raw: string): string {
  const out: string[] = [];
  let i = 0;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(raw))) {
    out.push(renderTextWithBareUrls(raw.slice(i, m.index)));
    out.push(`<a href="${escapeAttr(m[2])}">${escapeHtml(m[1])}</a>`);
    i = m.index + m[0].length;
  }
  out.push(renderTextWithBareUrls(raw.slice(i)));
  return out.join("");
}

function renderTextWithBareUrls(text: string): string {
  const out: string[] = [];
  let i = 0;
  const urlRe = /https?:\/\/[^\s)]+/g;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text))) {
    out.push(escapeHtml(text.slice(i, m.index)));
    const url = m[0].replace(/[.,;]+$/, "");
    out.push(`<a href="${escapeAttr(url)}">${escapeHtml(formatLinkText(url))}</a>`);
    i = m.index + url.length;
  }
  out.push(escapeHtml(text.slice(i)));
  return out.join("");
}
