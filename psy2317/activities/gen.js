/* Problem generators for compute-it-yourself activities. Every answer is computed from the generated data. */
(function (root) {
  const S = root.STATS || require('./stats.js');
  const G = {};
  const f2 = x => (Math.round(x * 100) / 100);
  const fmt = (x, d = 2) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString();
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
  const N = (label, ans, o = {}) => ({ k: 'num', label, ans, tol: o.tol != null ? o.tol : Math.max(0.011, Math.abs(ans) * 0.004), hint: o.hint || '', expl: o.expl || '', wrong: o.wrong || [] });
  const C = (label, opts, ansIdx, expl, hint) => ({ k: 'choice', label, opts, ans: ansIdx, expl: expl || '', hint: hint || '' });
  const tbl = (head, rows) => '<table class="d"><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  const list = a => a.join(', ');
  /* n ints with an exact integer mean M, spread about sd */
  function nice(R, n, M, sd) {
    const a = []; for (let i = 0; i < n; i++) a.push(Math.round(M + (R() * 2 - 1) * sd * 1.7));
    let d = M * n - S.sum(a), i = 0; while (d !== 0) { const s = d > 0 ? 1 : -1; a[i % n] += s; d -= s; i++; }
    return a;
  }
  function distinctOk(a) { return new Set(a).size >= Math.min(a.length - 1, 4); }
  function niceRetry(R, n, M, sd) { let a, t = 0; do { a = nice(R, n, M, sd); t++; } while (!distinctOk(a) && t < 50); return a; }
  const dec = (cond, y, n) => cond ? y : n;

  G.freq = R => {
    let f; do { f = []; for (let i = 0; i < 6; i++) f.push(ri(R, 1, 5)); } while (S.sum(f) !== 15 && (f = null, true) && false);
    // build freqs summing to 15 over 6 values
    f = [1, 1, 1, 1, 1, 1]; for (let r = 0; r < 9; r++) f[ri(R, 0, 5)]++;
    const x0 = ri(R, 1, 4), X = [0, 1, 2, 3, 4, 5].map(i => x0 + 5 - i);
    const n = 15, sx = S.sum(X.map((x, i) => x * f[i])), sxx = S.sum(X.map((x, i) => x * x * f[i]));
    const mi = f.indexOf(Math.max(...f)), p = f[mi] / n;
    return {
      intro: 'Fifteen students rated how many hours they slept last night. The frequency table is below.',
      table: tbl(['X', 'f'], X.map((x, i) => [x, f[i]])),
      steps: [
        N('n (the sum of the f column)', n, { tol: 0.01, hint: 'Add the frequencies.', expl: 'The frequencies always add to n.' }),
        N('ΣX (sum of the scores)', sx, { tol: 0.01, hint: 'Multiply each X by its f, then add.', expl: 'ΣX = Σ(f · X).', wrong: [[S.sum(X), 'That adds each distinct X once. Each score counts f times, so multiply X by f first.']] }),
        N('ΣX² (sum of the squared scores)', sxx, { tol: 0.01, hint: 'Square each X, multiply by its f, then add.', expl: 'ΣX² = Σ(f · X²).', wrong: [[sx * sx, 'That is (ΣX)². For ΣX², square each score first, then add.']] }),
        N('Proportion of students with X = ' + X[mi] + ' (3 decimals)', p, { tol: 0.002, hint: 'p = f / n.', expl: 'p = ' + f[mi] + ' / 15 = ' + fmt(p, 3) + '.' }),
        N('Percentage of students with X = ' + X[mi], p * 100, { tol: 0.2, hint: 'Multiply the proportion by 100.', expl: 'Percentage = proportion × 100.' })
      ]
    };
  };

  G.central = R => {
    const mode = ri(R, 4, 9); let a = [mode, mode, mode]; while (a.length < 7) { const v = ri(R, 2, 14); if (v !== mode && a.indexOf(v) < 0) a.push(v); }
    a.sort((x, y) => x - y); const mean = S.mean(a), med = a[3], mx = a[6] + 40; const b = a.slice(0, 6).concat([mx]); b.sort((x, y) => x - y);
    return {
      intro: 'Seven students reported the number of minutes they spent on homework. The scores are listed in order.',
      table: '<p class="scores">' + list(a) + '</p>',
      steps: [
        N('Mean', mean, { hint: 'Add the scores and divide by 7.', expl: 'ΣX = ' + S.sum(a) + ', so the mean is ' + S.sum(a) + ' / 7 = ' + fmt(mean) + '.' }),
        N('Median', med, { tol: 0.01, hint: 'The scores are in order. Find the middle one.', expl: 'With 7 scores, the median is the 4th score.' }),
        N('Mode', mode, { tol: 0.01, hint: 'Which score appears most often?', expl: 'The mode is the most frequent score.' }),
        N('Now replace the largest score (' + a[6] + ') with ' + mx + '. New mean', S.mean(b), { hint: 'Recompute the total and divide by 7.', expl: 'One extreme score pulled the mean up from ' + fmt(mean) + ' to ' + fmt(S.mean(b)) + '.' }),
        N('New median', b[3], { tol: 0.01, hint: 'The middle score may not change.', expl: 'The median depends on position, not size, so it stays ' + b[3] + '.' }),
        C('Which measure was pulled more by the extreme score?', ['The mean', 'The median', 'Both moved the same amount'], 0, 'The mean uses every score\'s size. The median only needs the middle position.')
      ]
    };
  };

  G.iqr = R => {
    let a; do { a = []; while (a.length < 8) { const v = ri(R, 3, 40); if (a.indexOf(v) < 0) a.push(v); } a.sort((x, y) => x - y); } while (false);
    const med = (a[3] + a[4]) / 2, q1 = (a[1] + a[2]) / 2, q3 = (a[5] + a[6]) / 2;
    return {
      intro: 'Eight students\' scores on a short quiz, in order. Split the ordered scores at the median and take the median of each half.',
      table: '<p class="scores">' + list(a) + '</p>',
      steps: [
        N('Median of all eight scores', med, { hint: 'Average the 4th and 5th scores.', expl: 'With an even number of scores, average the two middle ones.' }),
        N('Q1 (median of the lower four scores)', q1, { hint: 'Average the 2nd and 3rd scores.', expl: 'Q1 is the median of ' + list(a.slice(0, 4)) + '.' }),
        N('Q3 (median of the upper four scores)', q3, { hint: 'Average the 6th and 7th scores.', expl: 'Q3 is the median of ' + list(a.slice(4)) + '.' }),
        N('Interquartile range', q3 - q1, { hint: 'Q3 minus Q1.', expl: 'IQR = Q3 − Q1 = ' + fmt(q3 - q1) + '.' }),
        N('Range', a[7] - a[0], { tol: 0.01, hint: 'Highest minus lowest.', expl: 'The range uses only the two extreme scores.' })
      ]
    };
  };

  G.ssvar = R => {
    const M = ri(R, 4, 10), a = niceRetry(R, 6, M, 2.2), sx = S.sum(a), sxx = S.sum(a.map(x => x * x)), ss = sxx - sx * sx / 6;
    return {
      intro: 'These six scores are an entire population (N = 6). Use the computational formula SS = ΣX² − (ΣX)² / N.',
      table: '<p class="scores">' + list(a) + '</p>',
      steps: [
        N('ΣX', sx, { tol: 0.01, hint: 'Add the scores.', expl: 'ΣX = ' + sx + '.' }),
        N('ΣX²', sxx, { tol: 0.01, hint: 'Square each score, then add.', expl: 'ΣX² = ' + sxx + '.', wrong: [[sx * sx, 'That is (ΣX)². Square each score first, then add.']] }),
        N('SS', ss, { hint: 'ΣX² minus (ΣX)² divided by N.', expl: 'SS = ' + sxx + ' − ' + sx + '² / 6 = ' + fmt(ss) + '.' }),
        N('Population variance σ²', ss / 6, { hint: 'Divide SS by N.', expl: 'σ² = SS / N = ' + fmt(ss / 6) + '.' }),
        N('Population standard deviation σ', Math.sqrt(ss / 6), { hint: 'Take the square root of the variance.', expl: 'σ = √' + fmt(ss / 6) + ' = ' + fmt(Math.sqrt(ss / 6)) + '.', wrong: [[ss / 6, 'That is the variance. The standard deviation is its square root.']] })
      ]
    };
  };

  G.svar = R => {
    const M = ri(R, 4, 12), a = niceRetry(R, 6, M, 2.4), ss = S.ss(a), s2 = ss / 5;
    return {
      intro: 'These six scores are a sample (n = 6). Estimate the population variance from them.',
      table: '<p class="scores">' + list(a) + '</p>',
      steps: [
        N('Sample mean', M, { tol: 0.01, hint: 'Add the scores and divide by 6.', expl: 'M = ' + S.sum(a) + ' / 6 = ' + M + '.' }),
        N('SS (sum of squared deviations)', ss, { hint: 'Subtract the mean from each score, square, and add.', expl: 'Deviations: ' + list(a.map(x => x - M)) + '. Squared and added: ' + fmt(ss) + '.' }),
        N('Degrees of freedom', 5, { tol: 0.01, hint: 'n − 1.', expl: 'df = n − 1 = 5.' }),
        N('Sample variance s²', s2, { hint: 'SS divided by df.', expl: 's² = ' + fmt(ss) + ' / 5 = ' + fmt(s2) + '.', wrong: [[ss / 6, 'That divides by n. A sample estimate divides by df = n − 1, which corrects for samples missing extreme scores.']] }),
        N('Sample standard deviation s', Math.sqrt(s2), { hint: 'Square root of s².', expl: 's = √' + fmt(s2) + ' = ' + fmt(Math.sqrt(s2)) + '.', wrong: [[s2, 'That is the variance. Take its square root.']] })
      ]
    };
  };

  G.z = R => {
    const mu = ri(R, 50, 100), sg = pick(R, [4, 5, 8, 10, 12]), k = pick(R, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]);
    const X = mu + k * sg, zt = pick(R, [-1.25, -0.75, 0.75, 1.25, 1.75]), Y = mu + zt * sg;
    const mu2 = ri(R, 60, 90), sg2 = pick(R, [3, 6, 9]), k2 = pick(R, [-1, 1, 2]), X2 = mu2 + k2 * sg2;
    const z1 = (X - mu) / sg, z2 = (X2 - mu2) / sg2;
    return {
      intro: 'Scores on Exam A are distributed with μ = ' + mu + ' and σ = ' + sg + '. Scores on Exam B have μ = ' + mu2 + ' and σ = ' + sg2 + '.',
      table: '',
      steps: [
        N('z score for X = ' + X + ' on Exam A', z1, { hint: '(X − μ) / σ.', expl: 'z = (' + X + ' − ' + mu + ') / ' + sg + ' = ' + fmt(z1) + '.', wrong: [[-z1, 'Check the sign. A score below the mean has a negative z.']] }),
        N('The score on Exam A that has z = ' + zt, Y, { hint: 'X = μ + zσ.', expl: 'X = ' + mu + ' + (' + zt + ')(' + sg + ') = ' + fmt(Y) + '.' }),
        N('z score for X = ' + X2 + ' on Exam B', z2, { hint: '(X − μ) / σ with Exam B\'s μ and σ.', expl: 'z = (' + X2 + ' − ' + mu2 + ') / ' + sg2 + ' = ' + fmt(z2) + '.' }),
        C('A student scored ' + X + ' on Exam A and ' + X2 + ' on Exam B. Which score stands higher relative to its class?', ['Exam A', 'Exam B', 'They are equal'], z1 > z2 ? 0 : (z2 > z1 ? 1 : 2), 'Compare z scores: ' + fmt(z1) + ' on Exam A and ' + fmt(z2) + ' on Exam B.')
      ]
    };
  };

  G.zprob = R => {
    const mu = 100, sg = 15, z1 = pick(R, [1.2, 1.4, 1.6, 1.8, 2.0]), z2 = pick(R, [0.6, 0.8, 1.0, 1.2]);
    const a = mu + z1 * sg, b = mu - z2 * sg, tailA = 1 - S.normCdf(z1), tailB = S.normCdf(-z2);
    return {
      intro: 'Scores are normally distributed with μ = 100 and σ = 15. Use the Unit Normal Table (or your own calculation, rounded to four decimals).',
      table: '',
      steps: [
        N('z score for X = ' + a, z1, { tol: 0.011, hint: '(X − μ) / σ.', expl: 'z = ' + (a - mu) + ' / 15 = ' + fmt(z1) + '.' }),
        N('Proportion of scores ABOVE ' + a + ' (tail)', tailA, { tol: 0.0008, hint: 'Sketch the curve. Use the tail column for z = ' + fmt(z1) + '.', expl: 'The tail beyond z = ' + fmt(z1) + ' is ' + fmt(tailA, 4) + '.', wrong: [[1 - tailA, 'That is the body (the area below). The question asks for scores above.']] }),
        N('z score for X = ' + b, -z2, { tol: 0.011, hint: 'This score is below the mean.', expl: 'z = ' + (b - mu) + ' / 15 = ' + fmt(-z2) + '.' }),
        N('Proportion of scores BELOW ' + b, tailB, { tol: 0.0008, hint: 'By symmetry, the tail below −z equals the tail above +z.', expl: 'The tail is ' + fmt(tailB, 4) + '.' }),
        N('Proportion of scores BETWEEN ' + b + ' and ' + a, 1 - tailA - tailB, { tol: 0.0012, hint: 'Start with 1 and subtract the two tails.', expl: '1 − ' + fmt(tailA, 4) + ' − ' + fmt(tailB, 4) + ' = ' + fmt(1 - tailA - tailB, 4) + '.' }),
        N('The score that marks the top 10% of the distribution', mu + 1.28 * sg, { tol: 0.4, hint: 'The z that leaves .10 in the tail is about 1.28. Then X = μ + zσ.', expl: 'X = 100 + 1.28(15) = 119.2.' })
      ]
    };
  };

  G.se = R => {
    const mu = ri(R, 50, 100), sg = 20, n = pick(R, [16, 25, 36, 64]), se = sg / Math.sqrt(n), k = pick(R, [-1.6, -1.2, 1.2, 1.6, 2]), M = mu + k * se;
    const p = k > 0 ? 1 - S.normCdf(k) : S.normCdf(-k);
    return {
      intro: 'A population has μ = ' + mu + ' and σ = ' + sg + '. You draw a random sample of n = ' + n + ' and compute its mean.',
      table: '',
      steps: [
        N('Standard error of the mean', se, { hint: 'σ / √n.', expl: 'σM = ' + sg + ' / √' + n + ' = ' + fmt(se) + '.', wrong: [[sg, 'That is σ. The standard error divides σ by √n.'], [sg / n, 'Divide by √n, not by n.']] }),
        N('z score for a sample mean of M = ' + fmt(M), k, { tol: 0.011, hint: '(M − μ) / σM. Use the standard error, not σ.', expl: 'z = (' + fmt(M) + ' − ' + mu + ') / ' + fmt(se) + ' = ' + fmt(k) + '.', wrong: [[(M - mu) / sg, 'You divided by σ. For a sample mean, divide by the standard error.']] }),
        N('Probability that a sample mean is ' + (k > 0 ? 'ABOVE ' : 'BELOW ') + fmt(M), p, { tol: 0.0008, hint: 'Use the tail for |z| = ' + Math.abs(k) + '.', expl: 'The tail is ' + fmt(p, 4) + '.' }),
        N('Standard error if the sample size were ' + (4 * n) + ' instead', se / 2, { hint: 'Quadrupling n divides the standard error by 2.', expl: 'σ / √' + (4 * n) + ' = ' + fmt(se / 2) + '. To halve the standard error you need four times as many people.' })
      ]
    };
  };

  G.ztest = R => {
    const mu = 100, sg = 15, n = 25, se = 3, d = pick(R, [2, 3, 4, 5, 6, 7.5, 9]) * pick(R, [1, 1, -1]), M = mu + d, z = d / se, rej = Math.abs(z) > 1.96;
    return {
      intro: 'Reading scores in the population have μ = 100 and σ = 15. A tutoring program is given to n = 25 students, and their mean is M = ' + M + '. Test H₀: μ = 100 with a two-tailed test at α = .05.',
      table: '',
      steps: [
        N('Standard error σM', se, { hint: 'σ / √n.', expl: '15 / √25 = 3.' }),
        N('z statistic', z, { tol: 0.011, hint: '(M − μ) / σM.', expl: 'z = ' + (M - mu) + ' / 3 = ' + fmt(z) + '.' }),
        C('Decision at α = .05, two-tailed (critical z = ±1.96)', ['Reject H₀', 'Fail to reject H₀'], rej ? 0 : 1, '|z| = ' + fmt(Math.abs(z)) + (rej ? ' is beyond 1.96.' : ' is inside 1.96.')),
        N('Cohen\'s d', d / sg, { tol: 0.011, hint: 'Mean difference divided by σ (not by the standard error).', expl: 'd = ' + d + ' / 15 = ' + fmt(d / sg) + '.', wrong: [[z, 'That is z. For d, divide by σ, not by the standard error.']] }),
        N('Lower limit of the 95% confidence interval', M - 1.96 * se, { tol: 0.02, hint: 'M − 1.96 × σM.', expl: M + ' − 1.96(3) = ' + fmt(M - 1.96 * se) + '.' }),
        N('Upper limit of the 95% confidence interval', M + 1.96 * se, { tol: 0.02, hint: 'M + 1.96 × σM.', expl: M + ' + 1.96(3) = ' + fmt(M + 1.96 * se) + '.' })
      ]
    };
  };

  G.ttest1 = R => {
    const mu = 50, diff = pick(R, [2, 3, 4, 5, -3, 6]), M = mu + diff, a = niceRetry(R, 8, M, 4), ss = S.ss(a), df = 7, s2 = ss / df, s = Math.sqrt(s2), sm = s / Math.sqrt(8), t = diff / sm, tc = S.tCrit2(df), rej = Math.abs(t) > tc;
    return {
      intro: 'A sample of n = 8 scores is below. Test H₀: μ = 50 with a two-tailed test at α = .05.',
      table: '<p class="scores">' + list(a) + '</p>',
      steps: [
        N('Sample mean', M, { tol: 0.01, hint: 'Add the scores and divide by 8.', expl: 'M = ' + S.sum(a) + ' / 8 = ' + M + '.' }),
        N('SS', ss, { hint: 'Sum of squared deviations from the mean.', expl: 'SS = ' + fmt(ss) + '.' }),
        N('Degrees of freedom', df, { tol: 0.01, hint: 'n − 1.', expl: 'df = 7.' }),
        N('Sample variance s²', s2, { hint: 'SS / df.', expl: fmt(ss) + ' / 7 = ' + fmt(s2) + '.', wrong: [[ss / 8, 'That divides by n. Divide by df = 7.']] }),
        N('Estimated standard error sM', sm, { hint: 's / √n, where s = √s².', expl: 'sM = ' + fmt(s) + ' / √8 = ' + fmt(sm) + '.', wrong: [[s, 'That is s. Divide it by √n.'], [s2 / Math.sqrt(8), 'Use s (the square root of s²), then divide by √n.']] }),
        N('t statistic', t, { tol: 0.015, hint: '(M − μ) / sM.', expl: 't = ' + diff + ' / ' + fmt(sm) + ' = ' + fmt(t) + '.' }),
        N('Critical t (two-tailed, α = .05, df = 7)', tc, { tol: 0.01, hint: 'Look in the t table for df = 7.', expl: 'The critical value is ±' + fmt(tc, 3) + '.' }),
        C('Decision', ['Reject H₀', 'Fail to reject H₀'], rej ? 0 : 1, '|t| = ' + fmt(Math.abs(t)) + (rej ? ' exceeds ' : ' does not exceed ') + fmt(tc, 3) + '.'),
        N('Cohen\'s d', diff / s, { tol: 0.015, hint: 'Mean difference divided by s.', expl: 'd = ' + diff + ' / ' + fmt(s) + ' = ' + fmt(diff / s) + '.' }),
        N('Lower limit of the 95% CI for μ', M - tc * sm, { tol: 0.03, hint: 'M − critical t × sM.', expl: M + ' − ' + fmt(tc, 3) + '(' + fmt(sm) + ') = ' + fmt(M - tc * sm) + '.' })
      ]
    };
  };

  G.tind = R => {
    const n1 = 6, n2 = pick(R, [6, 7]), M2 = ri(R, 10, 20), D = pick(R, [2, 3, 4, 5, 6]), M1 = M2 + D, A = niceRetry(R, n1, M1, 3), B = niceRetry(R, n2, M2, 3);
    const ss1 = S.ss(A), ss2 = S.ss(B), df = n1 + n2 - 2, sp = (ss1 + ss2) / df, se = Math.sqrt(sp / n1 + sp / n2), t = D / se, tc = S.tCrit2(df), rej = Math.abs(t) > tc;
    return {
      intro: 'Two independent groups of students took a memory test. Test H₀: μ₁ = μ₂ with a two-tailed test at α = .05 (pooled variance).',
      table: tbl(['Group', 'n', 'Scores'], [['1', n1, list(A)], ['2', n2, list(B)]]),
      steps: [
        N('Mean of group 1', M1, { tol: 0.01, hint: 'Add and divide by n.', expl: 'M₁ = ' + M1 + '.' }),
        N('Mean of group 2', M2, { tol: 0.01, hint: 'Add and divide by n.', expl: 'M₂ = ' + M2 + '.' }),
        N('SS for group 1', ss1, { hint: 'Sum of squared deviations from M₁.', expl: 'SS₁ = ' + fmt(ss1) + '.' }),
        N('SS for group 2', ss2, { hint: 'Sum of squared deviations from M₂.', expl: 'SS₂ = ' + fmt(ss2) + '.' }),
        N('Degrees of freedom', df, { tol: 0.01, hint: 'n₁ + n₂ − 2.', expl: 'df = ' + n1 + ' + ' + n2 + ' − 2 = ' + df + '.' }),
        N('Pooled variance', sp, { hint: '(SS₁ + SS₂) / (df₁ + df₂).', expl: '(' + fmt(ss1) + ' + ' + fmt(ss2) + ') / ' + df + ' = ' + fmt(sp) + '.' }),
        N('Standard error of the difference', se, { hint: '√(s²p/n₁ + s²p/n₂).', expl: '√(' + fmt(sp) + '/' + n1 + ' + ' + fmt(sp) + '/' + n2 + ') = ' + fmt(se) + '.' }),
        N('t statistic', t, { tol: 0.015, hint: '(M₁ − M₂) / standard error.', expl: 't = ' + D + ' / ' + fmt(se) + ' = ' + fmt(t) + '.' }),
        N('Critical t (two-tailed, α = .05)', tc, { tol: 0.01, hint: 'Use df = ' + df + '.', expl: 'The critical value is ±' + fmt(tc, 3) + '.' }),
        C('Decision', ['Reject H₀', 'Fail to reject H₀'], rej ? 0 : 1, '|t| = ' + fmt(Math.abs(t)) + (rej ? ' exceeds ' : ' does not exceed ') + fmt(tc, 3) + '.'),
        N('Cohen\'s d', D / Math.sqrt(sp), { tol: 0.015, hint: 'Mean difference divided by the pooled standard deviation (√ of pooled variance).', expl: 'd = ' + D + ' / ' + fmt(Math.sqrt(sp)) + ' = ' + fmt(D / Math.sqrt(sp)) + '.' })
      ]
    };
  };

  G.trel = R => {
    const Dm = pick(R, [1, 2, 3, 4]), Dd = niceRetry(R, 8, Dm, 2.2), before = Dd.map(() => ri(R, 14, 26)), after = before.map((b, i) => b - Dd[i]);
    const ss = S.ss(Dd), s2 = ss / 7, sd = Math.sqrt(s2), se = sd / Math.sqrt(8), t = Dm / se, tc = S.tCrit2(7), rej = Math.abs(t) > tc;
    return {
      intro: 'Eight students rated their anxiety before and after a relaxation program (higher scores mean more anxiety). D = before − after. Test H₀: μD = 0, two-tailed, α = .05.',
      table: tbl(['Student', 'Before', 'After', 'D'], before.map((b, i) => [i + 1, b, after[i], Dd[i]])),
      steps: [
        N('Mean difference MD', Dm, { tol: 0.01, hint: 'Add the D scores and divide by 8.', expl: 'ΣD = ' + S.sum(Dd) + ', so MD = ' + Dm + '.' }),
        N('SS of the difference scores', ss, { hint: 'Sum of squared deviations of D from MD.', expl: 'SS = ' + fmt(ss) + '.' }),
        N('Variance of D', s2, { hint: 'SS / (n − 1).', expl: fmt(ss) + ' / 7 = ' + fmt(s2) + '.' }),
        N('Estimated standard error', se, { hint: 'sD / √n.', expl: fmt(sd) + ' / √8 = ' + fmt(se) + '.' }),
        N('t statistic', t, { tol: 0.015, hint: 'MD / standard error.', expl: 't = ' + Dm + ' / ' + fmt(se) + ' = ' + fmt(t) + '.' }),
        N('Critical t (df = 7)', tc, { tol: 0.01, hint: 'df = pairs − 1.', expl: '±' + fmt(tc, 3) + '.' }),
        C('Decision', ['Reject H₀', 'Fail to reject H₀'], rej ? 0 : 1, '|t| = ' + fmt(Math.abs(t)) + (rej ? ' exceeds ' : ' does not exceed ') + fmt(tc, 3) + '.'),
        N('Cohen\'s d', Dm / sd, { tol: 0.015, hint: 'MD divided by sD.', expl: 'd = ' + Dm + ' / ' + fmt(sd) + ' = ' + fmt(Dm / sd) + '.' })
      ]
    };
  };

  G.anova = R => {
    const mus = [ri(R, 5, 8), ri(R, 8, 11), ri(R, 11, 14)], k = 3, n = 5, grp = mus.map(m => niceRetry(R, n, m, 1.6));
    const T = grp.map(S.sum), G_ = S.sum(T), sxx = S.sum(grp.map(g => S.sum(g.map(x => x * x)))), N_ = 15, corr = G_ * G_ / N_;
    const sst = sxx - corr, ssw = S.sum(grp.map(S.ss)), ssb = S.sum(T.map(t => t * t / n)) - corr, msb = ssb / 2, msw = ssw / 12, F = msb / msw, fc = S.fCrit(2, 12), rej = F > fc;
    return {
      intro: 'Fifteen students used one of three study strategies (n = 5 each). Test H₀: μ₁ = μ₂ = μ₃ at α = .05.',
      table: tbl(['Strategy', 'Scores', 'T (total)', 'SS within group'], grp.map((g, i) => ['ABC'[i], list(g), T[i], fmt(S.ss(g))])) + '<p class="scores">Grand total G = ' + G_ + ' &nbsp;&nbsp; ΣX² (all 15 scores) = ' + sxx + '</p>',
      steps: [
        N('G² / N (the correction term)', corr, { hint: 'Square the grand total and divide by 15.', expl: G_ + '² / 15 = ' + fmt(corr) + '.' }),
        N('SS total', sst, { hint: 'ΣX² − G²/N.', expl: sxx + ' − ' + fmt(corr) + ' = ' + fmt(sst) + '.' }),
        N('SS within', ssw, { hint: 'Add the three group SS values.', expl: 'The group SS values add to ' + fmt(ssw) + '.' }),
        N('SS between', ssb, { hint: 'Σ(T²/n) − G²/N. Or SS total − SS within.', expl: 'SS between = ' + fmt(ssb) + '. Check: ' + fmt(ssb) + ' + ' + fmt(ssw) + ' = ' + fmt(sst) + '.', wrong: [[sst - ssw + 0.0, '']].slice(0, 0) }),
        N('df between', 2, { tol: 0.01, hint: 'Number of groups − 1.', expl: 'k − 1 = 2.' }),
        N('df within', 12, { tol: 0.01, hint: 'Total N − number of groups.', expl: '15 − 3 = 12.' }),
        N('MS between', msb, { hint: 'SS between / df between.', expl: fmt(ssb) + ' / 2 = ' + fmt(msb) + '.' }),
        N('MS within', msw, { hint: 'SS within / df within.', expl: fmt(ssw) + ' / 12 = ' + fmt(msw) + '.' }),
        N('F', F, { tol: 0.03, hint: 'MS between / MS within.', expl: 'F = ' + fmt(msb) + ' / ' + fmt(msw) + ' = ' + fmt(F) + '.' }),
        N('Critical F (2, 12) at α = .05', fc, { tol: 0.02, hint: 'Look in the F table for df 2 and 12.', expl: 'The critical value is ' + fmt(fc, 2) + '.' }),
        C('Decision', ['Reject H₀: at least one mean differs', 'Fail to reject H₀'], rej ? 0 : 1, 'F = ' + fmt(F) + (rej ? ' exceeds ' : ' does not exceed ') + fmt(fc, 2) + '.'),
        N('η² (eta squared)', ssb / sst, { tol: 0.011, hint: 'SS between / SS total.', expl: 'η² = ' + fmt(ssb) + ' / ' + fmt(sst) + ' = ' + fmt(ssb / sst) + '.' })
      ]
    };
  };

  G.anova2 = R => {
    const base = ri(R, 6, 9), ea = pick(R, [0, 2, 3, 4]), eb = pick(R, [0, 1, 2, 3]), ei = pick(R, [0, 0, 2, -3, 3]);
    const means = [[base, base + eb], [base + ea, base + ea + eb + ei]];
    const cells = [[0, 1], [0, 1]].map((r, i) => r.map((_, j) => niceRetry(R, 4, means[i][j], 1.4)));
    const cT = cells.map(r => r.map(S.sum)), cn = 4, Nn = 16, G_ = S.sum(cT.flat()), sxx = S.sum(cells.flat().map(c => S.sum(c.map(x => x * x)))), corr = G_ * G_ / Nn;
    const sst = sxx - corr, ssw = S.sum(cells.flat().map(S.ss)), ssbc = S.sum(cT.flat().map(t => t * t / cn)) - corr;
    const rowT = cT.map(r => S.sum(r)), colT = [cT[0][0] + cT[1][0], cT[0][1] + cT[1][1]];
    const ssA = S.sum(rowT.map(t => t * t / 8)) - corr, ssB = S.sum(colT.map(t => t * t / 8)) - corr, ssAB = ssbc - ssA - ssB, msw = ssw / 12;
    const FA = ssA / msw, FB = ssB / msw, FAB = ssAB / msw, fc = S.fCrit(1, 12), sig = [FA > fc, FB > fc, FAB > fc];
    const names = ['A (row factor)', 'B (column factor)', 'A × B'], sigNames = names.filter((_, i) => sig[i]);
    const opts = ['None are significant', 'A only', 'B only', 'A × B only', 'A and B only', 'A and A × B only', 'B and A × B only', 'A, B, and A × B'];
    const code = (sig[0] ? 1 : 0) + (sig[1] ? 2 : 0) + (sig[2] ? 4 : 0), map = { 0: 0, 1: 1, 2: 2, 4: 3, 3: 4, 5: 5, 6: 6, 7: 7 };
    return {
      intro: 'A 2 × 2 design with n = 4 per cell (N = 16). Factor A is the row, factor B is the column. Cell totals and the within-cell SS are given.',
      table: tbl(['', 'B1 total', 'B2 total'], [['A1', cT[0][0], cT[0][1]], ['A2', cT[1][0], cT[1][1]]]) + '<p class="scores">G = ' + G_ + ' &nbsp;&nbsp; ΣX² = ' + sxx + ' &nbsp;&nbsp; SS within (sum of the four cells) = ' + fmt(ssw) + '</p>',
      steps: [
        N('G² / N', corr, { hint: 'Square G and divide by 16.', expl: G_ + '² / 16 = ' + fmt(corr) + '.' }),
        N('SS between cells', ssbc, { hint: 'Σ(cell total² / 4) − G²/N.', expl: 'SS between cells = ' + fmt(ssbc) + '.' }),
        N('SS for A (rows)', ssA, { hint: 'Row totals: ' + rowT.join(' and ') + ', each row has 8 scores. Σ(row total² / 8) − G²/N.', expl: 'SS A = ' + fmt(ssA) + '.' }),
        N('SS for B (columns)', ssB, { hint: 'Column totals: ' + colT.join(' and ') + ', each column has 8 scores. Σ(column total² / 8) − G²/N.', expl: 'SS B = ' + fmt(ssB) + '.' }),
        N('SS for A × B', ssAB, { hint: 'SS between cells − SS A − SS B.', expl: fmt(ssbc) + ' − ' + fmt(ssA) + ' − ' + fmt(ssB) + ' = ' + fmt(ssAB) + '.' }),
        N('MS within (df = 12)', msw, { hint: 'SS within / 12.', expl: fmt(ssw) + ' / 12 = ' + fmt(msw) + '.' }),
        N('F for A', FA, { tol: 0.03, hint: 'Each effect has df = 1, so MS = SS. F = MS A / MS within.', expl: 'F = ' + fmt(ssA) + ' / ' + fmt(msw) + ' = ' + fmt(FA) + '.' }),
        N('F for B', FB, { tol: 0.03, hint: 'MS B / MS within.', expl: 'F = ' + fmt(FB) + '.' }),
        N('F for A × B', FAB, { tol: 0.03, hint: 'MS A×B / MS within.', expl: 'F = ' + fmt(FAB) + '.' }),
        N('Critical F (1, 12) at α = .05', fc, { tol: 0.02, hint: 'F table, df 1 and 12.', expl: 'The critical value is ' + fmt(fc, 2) + '.' }),
        C('Which effects are significant?', opts, map[code], 'Compare each F with ' + fmt(fc, 2) + ': A = ' + fmt(FA) + ', B = ' + fmt(FB) + ', A × B = ' + fmt(FAB) + '. When the interaction is significant, interpret it first.')
      ]
    };
  };

  function corrData(R) {
    let x, y, t = 0;
    do {
      x = []; while (x.length < 6) { const v = ri(R, 1, 10); x.push(v); }
      y = x.map(v => Math.max(1, Math.min(12, v + ri(R, -4, 4)))); t++;
    } while ((S.sum(x) % 6 !== 0 || S.sum(y) % 6 !== 0 || new Set(x).size < 5 || new Set(y).size < 5 || Math.abs(rOf(x, y)) < 0.45 || Math.abs(rOf(x, y)) > 0.97) && t < 5000);
    return [x, y];
  }
  function rOf(x, y) { const mx = S.mean(x), my = S.mean(y); let sp = 0; for (let i = 0; i < x.length; i++) sp += (x[i] - mx) * (y[i] - my); return sp / Math.sqrt(S.ss(x) * S.ss(y)); }
  G.corr = R => {
    const [x, y] = corrData(R), mx = S.mean(x), my = S.mean(y); let sp = 0; for (let i = 0; i < 6; i++) sp += (x[i] - mx) * (y[i] - my);
    const sx = S.ss(x), sy = S.ss(y), r = sp / Math.sqrt(sx * sy), rc = S.rCrit(4), rej = Math.abs(r) > rc;
    return {
      intro: 'Six students: X is hours studied, Y is quiz score. Compute the Pearson correlation and test it (two-tailed, α = .05).',
      table: tbl(['Student', 'X', 'Y'], x.map((v, i) => [i + 1, v, y[i]])),
      steps: [
        N('Mean of X', mx, { tol: 0.01, hint: 'Add and divide by 6.', expl: 'M_X = ' + mx + '.' }),
        N('Mean of Y', my, { tol: 0.01, hint: 'Add and divide by 6.', expl: 'M_Y = ' + my + '.' }),
        N('SP (sum of products of deviations)', sp, { hint: 'For each student multiply (X − M_X) by (Y − M_Y), then add.', expl: 'Products: ' + list(x.map((v, i) => fmt((v - mx) * (y[i] - my)))) + '. SP = ' + fmt(sp) + '.' }),
        N('SS of X', sx, { hint: 'Sum of squared deviations of X.', expl: 'SS_X = ' + fmt(sx) + '.' }),
        N('SS of Y', sy, { hint: 'Sum of squared deviations of Y.', expl: 'SS_Y = ' + fmt(sy) + '.' }),
        N('r', r, { tol: 0.011, hint: 'SP / √(SS_X × SS_Y).', expl: 'r = ' + fmt(sp) + ' / √(' + fmt(sx) + ' × ' + fmt(sy) + ') = ' + fmt(r) + '.', wrong: [[sp / (sx * sy), 'You need the square root of the product of the two SS values.']] }),
        N('r² (shared variability)', r * r, { tol: 0.011, hint: 'Square r.', expl: 'r² = ' + fmt(r * r) + ', so about ' + Math.round(r * r * 100) + '% of the variability is shared.' }),
        N('Critical r (df = 4, two-tailed, .05)', rc, { tol: 0.005, hint: 'df = n − 2 = 4. Use the r table.', expl: 'The critical value is ' + fmt(rc, 3) + '.' }),
        C('Decision', ['Reject H₀: the correlation is significant', 'Fail to reject H₀'], rej ? 0 : 1, '|r| = ' + fmt(Math.abs(r), 3) + (rej ? ' exceeds ' : ' does not exceed ') + fmt(rc, 3) + '.')
      ]
    };
  };

  G.regr = R => {
    const [x, y] = corrData(R), mx = S.mean(x), my = S.mean(y); let sp = 0; for (let i = 0; i < 6; i++) sp += (x[i] - mx) * (y[i] - my);
    const sx = S.ss(x), sy = S.ss(y), b = sp / sx, a = my - b * mx, r2 = sp * sp / (sx * sy), x0 = ri(R, 2, 9), pred = b * x0 + a, i0 = ri(R, 0, 5), res = y[i0] - (b * x[i0] + a);
    const ssres = (1 - r2) * sy, sest = Math.sqrt(ssres / 4), F = (r2 * sy) / (ssres / 4), fc = S.fCrit(1, 4);
    return {
      intro: 'Six students: X is hours studied, Y is quiz score. Build the regression line Ŷ = bX + a and test it.',
      table: tbl(['Student', 'X', 'Y'], x.map((v, i) => [i + 1, v, y[i]])) + '<p class="scores">M_X = ' + mx + ', M_Y = ' + my + ', SP = ' + fmt(sp) + ', SS_X = ' + fmt(sx) + ', SS_Y = ' + fmt(sy) + '</p>',
      steps: [
        N('Slope b', b, { tol: 0.011, hint: 'SP / SS_X.', expl: 'b = ' + fmt(sp) + ' / ' + fmt(sx) + ' = ' + fmt(b) + '.', wrong: [[sp / sy, 'You divided by SS_Y. The slope divides SP by SS_X (the predictor).']] }),
        N('Intercept a', a, { tol: 0.015, hint: 'M_Y − b × M_X.', expl: 'a = ' + my + ' − ' + fmt(b) + '(' + mx + ') = ' + fmt(a) + '.' }),
        N('Predicted score for a student who studies ' + x0 + ' hours', pred, { tol: 0.02, hint: 'Ŷ = bX + a.', expl: 'Ŷ = ' + fmt(b) + '(' + x0 + ') + ' + fmt(a) + ' = ' + fmt(pred) + '.' }),
        N('Residual for student ' + (i0 + 1) + ' (X = ' + x[i0] + ', Y = ' + y[i0] + ')', res, { tol: 0.03, hint: 'Actual Y minus predicted Y.', expl: 'Predicted = ' + fmt(b * x[i0] + a) + '. Residual = ' + y[i0] + ' − ' + fmt(b * x[i0] + a) + ' = ' + fmt(res) + '.', wrong: [[-res, 'Check the order. Residual = actual − predicted.']] }),
        N('r²', r2, { tol: 0.011, hint: 'SP² / (SS_X × SS_Y).', expl: 'r² = ' + fmt(r2) + '.' }),
        N('SS residual', ssres, { tol: 0.03, hint: '(1 − r²) × SS_Y.', expl: '(1 − ' + fmt(r2) + ')(' + fmt(sy) + ') = ' + fmt(ssres) + '.' }),
        N('Standard error of estimate', sest, { tol: 0.02, hint: '√(SS residual / (n − 2)).', expl: '√(' + fmt(ssres) + ' / 4) = ' + fmt(sest) + '.' }),
        N('F for the regression (df 1 and 4)', F, { tol: 0.06, hint: '(r² × SS_Y) / (SS residual / 4).', expl: 'F = ' + fmt(F) + '.' }),
        C('Is the line significant? Critical F(1, 4) = ' + fmt(fc, 2), ['Significant', 'Not significant'], F > fc ? 0 : 1, 'F = ' + fmt(F) + (F > fc ? ' exceeds ' : ' does not exceed ') + fmt(fc, 2) + '.')
      ]
    };
  };

  G.chisq = R => {
    let o; do { o = [ri(R, 8, 32), ri(R, 8, 32), ri(R, 8, 32), 0]; o[3] = 80 - o[0] - o[1] - o[2]; } while (o[3] < 6 || o[3] > 34);
    const chi = S.sum(o.map(v => (v - 20) * (v - 20) / 20)), c3 = S.chiCrit(3);
    let a, b, c, d; do { a = ri(R, 8, 30); b = ri(R, 8, 30); c = ri(R, 8, 30); d = ri(R, 8, 30); } while (Math.abs(a * d - b * c) < 60);
    const n = a + b + c + d, r1 = a + b, r2 = c + d, c1 = a + c, c2 = b + d, E = [r1 * c1 / n, r1 * c2 / n, r2 * c1 / n, r2 * c2 / n], O = [a, b, c, d];
    const chi2 = S.sum(O.map((v, i) => (v - E[i]) * (v - E[i]) / E[i])), c1c = S.chiCrit(1), phi = Math.sqrt(chi2 / n), or = (a / b) / (c / d);
    return {
      intro: 'Part 1. Eighty students named their favorite of four dining halls: ' + list(o) + '. Test whether the four halls are equally popular (α = .05).',
      table: '',
      steps: [
        N('Expected count in each hall', 20, { tol: 0.01, hint: 'If all four are equally popular, divide 80 by 4.', expl: '80 / 4 = 20.' }),
        N('χ²', chi, { tol: 0.03, hint: 'Σ (O − E)² / E over the four halls.', expl: 'Terms: ' + list(o.map(v => fmt((v - 20) * (v - 20) / 20))) + '. χ² = ' + fmt(chi) + '.' }),
        N('Degrees of freedom', 3, { tol: 0.01, hint: 'Number of categories − 1.', expl: 'df = 4 − 1 = 3.' }),
        C('Decision (critical χ² for df = 3 is ' + fmt(c3, 2) + ')', ['Reject H₀: the halls differ', 'Fail to reject H₀'], chi > c3 ? 0 : 1, 'χ² = ' + fmt(chi) + (chi > c3 ? ' exceeds ' : ' does not exceed ') + fmt(c3, 2) + '.'),
        C('Part 2. A 2 × 2 table of counts: row 1 = ' + a + ' and ' + b + '; row 2 = ' + c + ' and ' + d + '. (Rows are exposure, columns are outcome yes/no.) First, which test applies to two categorical variables?', ['Chi-square test for independence', 'Independent-measures t test', 'Pearson correlation'], 0, 'Counts in categories for two variables call for the chi-square test for independence.'),
        N('Expected count for the first cell (row 1, column 1)', E[0], { hint: '(row total × column total) / n.', expl: '(' + r1 + ' × ' + c1 + ') / ' + n + ' = ' + fmt(E[0]) + '.' }),
        N('χ² for the 2 × 2 table', chi2, { tol: 0.04, hint: 'Find all four expected counts, then Σ (O − E)² / E.', expl: 'Expected counts: ' + list(E.map(v => fmt(v))) + '. χ² = ' + fmt(chi2) + '.' }),
        C('Decision with df = 1 (critical χ² = 3.84)', ['Reject H₀: the variables are related', 'Fail to reject H₀'], chi2 > c1c ? 0 : 1, 'χ² = ' + fmt(chi2) + (chi2 > c1c ? ' exceeds ' : ' does not exceed ') + '3.84.'),
        N('Phi', phi, { tol: 0.011, hint: '√(χ² / n).', expl: 'phi = √(' + fmt(chi2) + ' / ' + n + ') = ' + fmt(phi) + '.' }),
        N('Odds ratio (odds in row 1 divided by odds in row 2)', or, { tol: 0.03, hint: '(a/b) / (c/d).', expl: '(' + a + '/' + b + ') / (' + c + '/' + d + ') = ' + fmt(or) + '.' })
      ]
    };
  };

  if (typeof module !== 'undefined') module.exports = G; else root.GEN = G;
})(typeof window !== 'undefined' ? window : globalThis);
