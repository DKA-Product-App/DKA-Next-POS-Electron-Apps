// helpers/electronMessageErrorExtraction.ts
export const serializeError = (err: any) => {
    const o: Record<string, any> = {};
    Object.getOwnPropertyNames(err || {}).forEach((k) => (o[k] = (err as any)[k]));
    for (const k in err || {}) o[k] = (err as any)[k];
    return o;
};

export const extractJsonFromMessage = (msg?: string) => {
    if (!msg || typeof msg !== 'string') return null;
    const s = msg.indexOf('{'); const e = msg.lastIndexOf('}');
    if (s === -1 || e === -1 || e <= s) return null;
    try { return JSON.parse(msg.slice(s, e + 1)); } catch { return null; }
};

export const isNetworkLike = (err: any, payload?: any) => {
    const codes = ['ENOTFOUND','ECONNREFUSED','ETIMEDOUT','ECONNABORTED'];
    const hit = codes.includes(err?.code) || codes.includes(payload?.code);
    const low = String(err?.message || payload?.msg || '').toLowerCase();
    const byMsg = low.includes('network error') || low.includes('offline');
    const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    return hit || byMsg || offline;
};

export const normalizeIpcError = (err: any) => {
    const e = serializeError(err);
    const fromAxios = e?.response?.data || null;
    const fromData  = e?.data || null;
    const fromMsg   = extractJsonFromMessage(e?.message);
    const payload   = fromAxios || fromData || fromMsg || null;

    const network = isNetworkLike(e, payload);
    const status  = typeof payload?.status === 'boolean' ? payload.status : undefined;
    const code    = payload?.code ?? e?.code ?? (network ? 530 : undefined);
    const msg     = payload?.msg ?? payload?.message ?? e?.message ?? 'Gagal menghubungi server';

    return { network, status, code, msg, extra: payload || undefined, raw: e };
};

export default normalizeIpcError;