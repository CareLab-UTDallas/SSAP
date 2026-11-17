/* Math helpers for PSY 2317 activities. No dependencies. */
(function (root) {
  const S = {};
  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    let s = 1.000000000190015; for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  function betacf(a, b, x) {
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m <= 500; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
    return h;
  }
  function betaI(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  S.normCdf = z => z >= 0 ? 0.5 * (1 + gammaP(0.5, z * z / 2)) : 0.5 * (1 - gammaP(0.5, z * z / 2));
  S.normPdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  S.tCdf = (t, df) => { const p = 0.5 * betaI(df / (df + t * t), df / 2, 0.5); return t > 0 ? 1 - p : p; };
  S.fCdf = (f, d1, d2) => f <= 0 ? 0 : betaI(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2);
  S.chiCdf = (x, k) => gammaP(k / 2, x / 2);
  function bisect(fn, lo, hi) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (fn(m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  S.normInv = p => bisect(z => S.normCdf(z) - p, -10, 10);
  S.tCrit2 = (df, alpha = 0.05) => bisect(t => S.tCdf(t, df) - (1 - alpha / 2), 0, 1000);
  S.tCrit1 = (df, alpha = 0.05) => bisect(t => S.tCdf(t, df) - (1 - alpha), 0, 1000);
  S.fCrit = (d1, d2, alpha = 0.05) => bisect(f => S.fCdf(f, d1, d2) - (1 - alpha), 0, 100000);
  S.chiCrit = (k, alpha = 0.05) => bisect(x => S.chiCdf(x, k) - (1 - alpha), 0, 1000);
  S.rCrit = (df, alpha = 0.05) => { const t = S.tCrit2(df, alpha); return t / Math.sqrt(t * t + df); };
  S.pT2 = (t, df) => 2 * (1 - S.tCdf(Math.abs(t), df));
  S.pF = (f, d1, d2) => 1 - S.fCdf(f, d1, d2);
  S.pChi = (x, k) => 1 - S.chiCdf(x, k);
  /* seeded random */
  S.rng = function (seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  S.sum = a => a.reduce((x, y) => x + y, 0);
  S.mean = a => S.sum(a) / a.length;
  S.ss = a => { const m = S.mean(a); return S.sum(a.map(x => (x - m) * (x - m))); };
  S.r2 = x => Math.round(x * 100) / 100;
  if (typeof module !== 'undefined') module.exports = S; else root.STATS = S;
})(typeof window !== 'undefined' ? window : globalThis);
