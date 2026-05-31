/** Parse nilai dari API (number atau string terformat id-ID seperti "99.000"). */
export function parseIdrValue(value?: number | string | null): number {
    if (value == null) return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    const s = String(value).trim()
    if (!s || s === '—') return 0
    const digits = s.replace(/[^\d]/g, '')
    if (!digits) return 0
    const n = Number(digits)
    return Number.isFinite(n) ? n : 0
}
