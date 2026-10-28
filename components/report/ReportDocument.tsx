import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Report } from '../../types';
import {
  COPY, Copy, Lang, MONTHS, SOURCE_URLS, EMIRATES_AR, SECTORS_EN_AR, SECTORS_AR_EN, COUNTRY_AR, DASH,
  flagFor, isBlank, show, toNumber, fmtInt, fmtCompact, fmtPct, fmtChange, withAed, formatDayDate, formatMonthYear,
} from './reportCopy';
import './report.css';

/* =====================================================================
   ReportDocument — renders the full A4 report for a Report record.
   Used by the print page (/print/:id) and the builder's live preview.

   Fixed pages: cover · summary · profile · UAE workforce (2 pages) ·
   partner workforce · delegations.
   Flowing sections (relationship summary, points, updates, agreements)
   are paginated by measuring real rendered heights, so longer text or
   larger fonts never get clipped.
   ===================================================================== */

export type SectionKey = 'cover' | 'summary' | 'profile' | 'uae' | 'partner' | 'relationship' | 'points' | 'updates' | 'agreements' | 'delegations';

interface Props {
  report: Report;
  lang: Lang;
  /** Called with 1-based page numbers whose content does not fit (fixed pages only). */
  onOverflow?: (pages: number[]) => void;
}

/* ---------- Rich text (escaped minimal markdown) ---------- */
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s: string) => escapeHtml(s)
  // isolate figures (24%, +12%, 6,200, 2.84B) so RTL shaping never splits a sign or % from its number
  .replace(/([+\-−]?\$?\d[\d,.]*(?:\s?%|[KMB]\b)?)/g, '<span class="num">$1</span>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

export const RichText: React.FC<{ text?: string }> = ({ text }) => {
  if (!text || !text.trim()) return null;
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      blocks.push(<ul key={key}>{list.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>);
      list = [];
    }
  };
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (/^[-•]\s+/.test(line)) list.push(line.replace(/^[-•]\s+/, ''));
    else {
      flush(`ul-${i}`);
      if (line) blocks.push(<p key={i} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  });
  flush('ul-end');
  return <div className="rpt-rich">{blocks}</div>;
};

/* ---------- Presentational pieces ---------- */
const Fact: React.FC<{ label: string; value: unknown; source?: React.ReactNode; tone?: 'warn' }> = ({ label, value, source, tone }) => (
  <div className="rpt-fact">
    <div className="lbl">{label}</div>
    <div className={`val ${isBlank(value) ? 'empty' : tone || ''}`}>{show(value)}</div>
    {source}
  </div>
);

const Section: React.FC<{ no?: string; title: string; lede?: string; sub?: boolean }> = ({ no, title, lede, sub }) => (
  <div className={`rpt-sec ${sub ? 'sub' : ''}`}>
    {no && <span className="no num">{no}</span>}
    <div>
      <h2>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </div>
  </div>
);

type BarItem = { name: string; value: number; label?: string };
const BarList: React.FC<{ items: BarItem[]; tone?: 'gold' | 'light'; wide?: boolean; emptyText: string; raw?: boolean }> = ({ items, tone, wide, emptyText, raw }) => {
  const rows = items.filter(i => (Number(i.value) || 0) > 0);
  if (!rows.length) return <div className="rpt-empty">{emptyText}</div>;
  const max = Math.max(...rows.map(r => Number(r.value) || 0), 1);
  return (
    <div className="rpt-bars">
      {rows.map((r, i) => (
        <div key={i} className={`rpt-bar ${wide ? 'wide' : ''}`}>
          <span className="n" title={r.name}>{r.name}</span>
          <span className="t"><span className={`f ${tone || ''}`} style={{ width: `${(Number(r.value) / max) * 100}%` }} /></span>
          <span className={`v ${r.label && /[\u0600-\u06FF]/.test(r.label) ? 'numx' : 'num'}`}>{r.label ?? (raw ? String(r.value) : fmtCompact(Number(r.value)))}</span>
        </div>
      ))}
    </div>
  );
};

const TwoColBars: React.FC<{ items: BarItem[]; tone?: 'gold' | 'light' }> = ({ items, tone }) => {
  const rows = items.filter(i => i.value > 0);
  const max = Math.max(...rows.map(r => r.value), 1);
  const half = Math.ceil(rows.length / 2);
  const col = (list: BarItem[]) => (
    <div className="rpt-bars">
      {list.map((r, i) => (
        <div key={i} className="rpt-bar">
          <span className="n" title={r.name}>{r.name}</span>
          <span className="t"><span className={`f ${tone || ''}`} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="v num">{fmtCompact(r.value)}</span>
        </div>
      ))}
    </div>
  );
  return <div className="rpt-grid2" style={{ columnGap: '8mm' }}>{col(rows.slice(0, half))}{col(rows.slice(half))}</div>;
};

/* 3-year workforce trend: totals per year (MOHRE + ICP) and the increase between years — no bars */
type TrendPt = { year: string; priv: number; dom: number; total: number };
const TrendFigures: React.FC<{ points: TrendPt[]; T: Copy; compact?: boolean }> = ({ points, T, compact }) => {
  const first = points[0], last = points[points.length - 1];
  const overall = points.length >= 2 ? fmtChange(first.total, last.total) : '';
  const Chip = ({ from, to, prev }: { from: number; to: number; prev: string }) => {
    const c = fmtChange(from, to);
    if (!c) return null;
    return <span className={`chg ${to >= from ? 'up' : 'down'}`}><span className="num">{c}</span> {T.vsYear(prev)}</span>;
  };
  const split = (p: TrendPt) => (p.priv || p.dom) ? (
    <span className="split"><span>{T.mohreShort} <b className="num">{fmtInt(p.priv)}</b></span><span>{T.icpShort} <b className="num">{fmtInt(p.dom)}</b></span></span>
  ) : null;

  if (compact) {
    return (
      <div className="rpt-years compact">
        {points.map((p, i) => (
          <div key={p.year} className="yr">
            <span className="y num">{p.year}</span>
            <span className="t num">{fmtInt(p.total)}</span>
            {i > 0 ? <Chip from={points[i - 1].total} to={p.total} prev={points[i - 1].year} /> : <span />}
          </div>
        ))}
        {overall && (
          <div className="yr overall">
            <span className="y">{T.overallChange}</span>
            <span className="t num">{overall}</span>
            <span className="rng"><span className="num">{first.year}</span> – <span className="num">{last.year}</span></span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="rpt-years">
      {points.map((p, i) => (
        <div key={p.year} className="yr">
          <div className="y num">{p.year}</div>
          <div className="t num">{fmtInt(p.total)}</div>
          {split(p)}
          <div className="c">{i > 0 ? <Chip from={points[i - 1].total} to={p.total} prev={points[i - 1].year} /> : <span className="base">{T.baseYear}</span>}</div>
        </div>
      ))}
      {overall && (
        <div className="yr overall">
          <div className="y">{T.overallChange}</div>
          <div className="t num">{overall}</div>
          <div className="rng"><span className="num">{first.year}</span> – <span className="num">{last.year}</span></div>
          <div className="c"><span className="num">{fmtInt(last.total - first.total)}</span> {T.moreWorkers}</div>
        </div>
      )}
    </div>
  );
};

/* bar + value + share for distribution tables */
const DistCell: React.FC<{ v: number; max: number; total: number; tone: 'm' | 'i' }> = ({ v, max, total, tone }) => (
  <div className="dc">
    <span className="t"><span className={`f ${tone}`} style={{ width: `${(v / max) * 100}%` }} /></span>
    <span className="v num">{v ? v.toLocaleString('en-US') : DASH}</span>
    <span className="p num">{v && total ? `${Math.round((v / total) * 100)}%` : ''}</span>
  </div>
);

/* KPI box: optional entity (official name) on top, label, value pinned to the bottom so values align across a row */
const KBox: React.FC<{ ent?: string; label: string; value: React.ReactNode; lead?: boolean; small?: boolean }> = ({ ent, label, value, lead, small }) => (
  <div className={`kb ${lead ? 'lead' : ''}`}>
    {ent && <div className="ent">{ent}</div>}
    <div className="lbl">{label}</div>
    <div className={`val ${small ? 'sm' : 'num'}`}>{value}</div>
  </div>
);

/* Workforce in the UAE: big total + breakdown under official entity names, numbers in one aligned column */
const WorkforceBand: React.FC<{ T: Copy; total: number; mohreWorkers?: string; mohreDomestic?: string; icp?: string }> = ({ T, total, mohreWorkers, mohreDomestic, icp }) => (
  <div className="rpt-wband">
    <div className="tot">
      <div className="lbl">{T.totalWorkforce}</div>
      <div className="val num">{total ? Number(total).toLocaleString('en-US') : DASH}</div>
    </div>
    <div className="brk">
      <div className="grp">
        <div className="ent">{T.entMohre}</div>
        <div className="row"><span className="c">{T.catWorkers}</span><span className="n num">{fmtInt(mohreWorkers)}</span></div>
        <div className="row"><span className="c">{T.catDomestic}</span><span className="n num">{fmtInt(mohreDomestic)}</span></div>
      </div>
      <div className="grp">
        <div className="ent">{T.entIcp}</div>
        <div className="row"><span className="c">{T.catWorkers}</span><span className="n num">{fmtInt(icp)}</span></div>
      </div>
    </div>
  </div>
);

const chunkFixed = <X,>(arr: X[], size: number): number[][] => {
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size).map((_, j) => i + j));
  return out;
};

/* =====================================================================
   Component
   ===================================================================== */
export default function ReportDocument({ report, lang, onOverflow }: Props) {
  const T = COPY[lang];
  const isRTL = lang === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const { data } = report;
  const uae = data.uaeWorkforceStats;
  const mohre = uae.mohre;

  /* ---------- Derived values ---------- */
  const countryRaw = data.country || '';
  const country = (isRTL ? (COUNTRY_AR[countryRaw.toLowerCase().trim()] || countryRaw) : countryRaw) || DASH;
  const flag = flagFor(countryRaw, data.flagUrl);
  const officialName = ((data as any).countryOfficialName || '').trim() || country;

  const reportDateObj = data.reportDate ? new Date(data.reportDate) : new Date();
  const validDate = !isNaN(reportDateObj.getTime());
  const reportYear = (validDate ? reportDateObj : new Date()).getFullYear();
  const prevYear = reportYear - 1;
  const defaultMonth = `${MONTHS[lang][(validDate ? reportDateObj : new Date()).getMonth()]} ${reportYear}`;
  const dataAsOf = data.reportMonthYear || formatMonthYear(mohre.totalPrivate?.date, lang) || defaultMonth;
  const issuedOn = formatDayDate(new Date().toISOString(), lang);

  const Src: React.FC<{ k: keyof Copy['src']; year?: number | string }> = ({ k, year }) => {
    const label = `${T.src.source}: ${T.src[k]}${year ? `${isRTL ? '، ' : ', '}${year}` : ''}`;
    const url = SOURCE_URLS[k];
    return <span className="rpt-src">{url ? <a href={url} target="_blank" rel="noopener noreferrer">{label}</a> : label}</span>;
  };

  const emirate = (n: string) => (isRTL ? EMIRATES_AR[n] || n : n);
  const sector = (n: string) => (isRTL ? SECTORS_EN_AR[n] || n : SECTORS_AR_EN[n] || n);

  const topWithOther = (list: { name: string; value: number }[], limit = 8) => {
    const sorted = [...(list || [])].map(s => ({ name: sector(s.name), value: Number(s.value) || 0 })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);
    if (sorted.length <= limit) return sorted;
    const rest = sorted.slice(limit).reduce((s, x) => s + x.value, 0);
    return rest > 0 ? [...sorted.slice(0, limit), { name: T.other, value: rest }] : sorted.slice(0, limit);
  };

  const mohreEmirates = [...mohre.byEmirate].map(e => ({ name: emirate(e.name), value: Number(e.value) || 0 })).sort((a, b) => b.value - a.value);
  const icpEmirates = [...uae.icp.byEmirate].map(e => ({ name: emirate(e.name), value: Number(e.value) || 0 })).sort((a, b) => b.value - a.value);
  const mohreSectors = topWithOther(mohre.bySector);
  const icpSectors = topWithOther(uae.icp.bySector || []);

  const sumMohre = mohre.byEmirate.reduce((a, c) => a + (Number(c.value) || 0), 0);
  const sumIcp = uae.icp.byEmirate.reduce((a, c) => a + (Number(c.value) || 0), 0);
  // Total = MOHRE labour + MOHRE domestic + ICP
  const mohreWorkers = toNumber(mohre.totalPrivate?.value) || 0;
  const mohreDomestic = toNumber(mohre.totalDomestic?.value) || 0;
  const icpRaw = (uae.icp as any).totalWorkers;
  const icpWorkers = toNumber(icpRaw) || 0;
  const totalWorkers = uae.totalWorkersOverride
    ? uae.totalWorkersOverride
    : (mohreWorkers + mohreDomestic + icpWorkers) || (sumMohre + sumIcp);

  const trend: TrendPt[] = (uae.trend || [])
    .map(p => {
      const priv = Number(p.privateSector) || 0, dom = Number(p.domestic) || 0;
      return { year: String(p.year || '').trim(), priv, dom, total: Number(p.total) || priv + dom };
    })
    .filter(p => p.year && p.total > 0)
    .sort((a, b) => a.year.localeCompare(b.year))
    .slice(-3);
  const trendChange = trend.length >= 2 ? fmtChange(trend[0].total, trend[trend.length - 1].total) : '';

  const salary = (uae.salaryBySector || [])
    .map(s => ({ name: sector(s.name), market: Number(s.uaeValue) || 0, partner: Number(s.partnerValue) || 0 }))
    .filter(s => s.market > 0 || s.partner > 0)
    .sort((a, b) => b.market - a.market)
    .slice(0, 8);
  const salaryMax = Math.max(...salary.flatMap(s => [s.market, s.partner]), 1);

  /* page 5: combined emirate rows, sector rows, takeaways */
  const emirateRows = mohre.byEmirate.map((e, i) => ({
    key: e.name, name: emirate(e.name), mohre: Number(e.value) || 0,
    icp: Number(uae.icp.byEmirate.find(x => x.name === e.name)?.value ?? uae.icp.byEmirate[i]?.value) || 0,
  })).sort((a, b) => (b.mohre + b.icp) - (a.mohre + a.icp));
  const emMax = Math.max(...emirateRows.flatMap(r => [r.mohre, r.icp]), 1);
  const sectorNames = Array.from(new Set([...mohreSectors.map(x => x.name), ...icpSectors.map(x => x.name)]));
  const sectorRows = sectorNames.map(n => ({ name: n, mohre: mohreSectors.find(x => x.name === n)?.value || 0, icp: icpSectors.find(x => x.name === n)?.value || 0 }))
    .sort((a, b) => (b.mohre + b.icp) - (a.mohre + a.icp));
  const secMax = Math.max(...sectorRows.flatMap(r => [r.mohre, r.icp]), 1);
  const secTotalM = mohreSectors.reduce((a, x) => a + x.value, 0);
  const secTotalI = icpSectors.reduce((a, x) => a + x.value, 0);
  const pct = (v: number, t: number) => (t ? Math.round((v / t) * 100) : 0);
  const topEm = [...emirateRows].sort((a, b) => b.mohre - a.mohre)[0];
  const topEmirate = topEm && topEm.mohre ? { name: topEm.name, pct: pct(topEm.mohre, sumMohre) } : null;
  const topSec = mohreSectors.filter(x => x.name !== T.other)[0];
  const topSector = topSec ? { name: topSec.name, pct: pct(topSec.value, secTotalM) } : null;
  const salaryBoth = salary.filter(x => x.market && x.partner);
  const avgGap = salaryBoth.length ? Math.round(salaryBoth.reduce((a, x) => a + (x.partner - x.market) / x.market, 0) / salaryBoth.length * 100) : null;
  const gapBelow = salaryBoth.filter(x => x.partner < x.market).length;
  const gaps = salaryBoth.map(x => ({ ...x, gap: Math.round(((x.partner - x.market) / x.market) * 100) })).sort((a, b) => a.gap - b.gap);
  const widest = gaps.length ? gaps[0] : null;
  const closest = gaps.length > 1 ? gaps[gaps.length - 1] : null;
  const emByMohre = [...emirateRows].sort((a, b) => b.mohre - a.mohre).filter(r => r.mohre > 0);
  const top3 = emByMohre.length >= 3 && sumMohre ? { pct: pct(emByMohre.slice(0, 3).reduce((a, r) => a + r.mohre, 0), sumMohre), names: emByMohre.slice(0, 3).map(r => r.name).join(isRTL ? '، ' : ', ') } : null;

  const pctNum = (v: unknown) => {
    const n = toNumber(v);
    return n === null ? null : Math.max(0, Math.min(100, n));
  };
  const wageGap = (partner?: string, market?: string) => {
    const p = toNumber(partner), m = toNumber(market);
    if (p === null || m === null || m === 0) return DASH;
    const d = Math.round(((p - m) / m) * 100);
    return `${d > 0 ? '+' : ''}${d}%`;
  };
  const hasWageTable = [mohre.skilledPartnerWage, mohre.skilledUaeWage, mohre.unskilledPartnerWage, mohre.unskilledUaeWage].some(v => !isBlank(v));

  const agreementStatus = (agr: any) => {
    const s = String(agr.status || 'active').toLowerCase();
    if (s === 'custom' || (agr.customStatusText && s !== 'active' && s !== 'pending')) return { label: agr.customStatusText || T.pending, cls: 'warn' };
    if (s === 'pending' || s.includes('تنفيذ') || s.includes('إجراء')) return { label: T.pending, cls: 'warn' };
    return { label: T.active, cls: 'ok' };
  };

  const byDateDesc = <X extends { date?: string }>(a: X, b: X) => (b.date || '').localeCompare(a.date || '');
  const interactions = [...data.recentInteractions].sort(byDateDesc);
  const points = data.pointsOfDiscussion || [];
  const updates = data.previousAgreementsAndUpdates || [];
  const agreements = [...data.bilateralAgreements].sort(byDateDesc);
  const activeAgreements = agreements.filter(a => agreementStatus(a).cls === 'ok' && a.party === 'mohre').length;
  const latestEngagement = interactions[0]?.date ? formatMonthYear(interactions[0].date, lang) : '';
  const nMohre = interactions.filter(i => i.party === 'mohre').length;
  const nGov = interactions.filter(i => i.party === 'uae_gov').length;
  const hidden = new Set<string>((data as any).hiddenSections || []);
  const on = (k: string) => !hidden.has(k);
  const keyMessages = (data.keyMessages || []).filter(m => m && m.trim());
  const objectives = ((data as any).meetingObjectives || []).map((o: string) => (o || '').trim()).filter(Boolean) as string[];
  const lastInts = (((data as any).lastInteractions || []) as any[]).filter(x => x && (x.title?.trim() || x.brief?.trim())).slice(0, 2);

  /* ---------- Item renderers (shared by pages and the measuring pass) ---------- */
  const PartyBadge = ({ party }: { party?: string }) =>
    party === 'mohre' ? <span className="rpt-party mohre">{T.partyMohre}</span>
      : party === 'uae_gov' ? <span className="rpt-party gov">{T.partyGov}</span> : null;

  const renderInteraction = (i: number) => {
    const it = interactions[i];
    return (
      <div className={`rpt-entry party-${it.party || 'none'}`}>
        <div className="meta">
          <span className="date">{formatDayDate(it.date, lang) || DASH}</span>
          <PartyBadge party={it.party} />
          {it.type && <span className="rpt-tag">{it.type}</span>}
        </div>
        <div>
          <h4>{it.title}</h4>
          <RichText text={it.details} />
        </div>
      </div>
    );
  };
  const renderPoint = (list: typeof points, alt: boolean) => (i: number) => {
    const pt = list[i];
    return (
      <div className={`rpt-point ${alt ? 'alt' : ''}`}>
        <span className="idx num">{i + 1}</span>
        <div>
          <h4>
            {pt.title}
            {alt && pt.status && <span className={`rpt-status ${pt.status === 'done' ? 'ok' : 'warn'}`} style={{ marginInlineStart: '3mm', verticalAlign: '.15em' }}>{pt.status === 'done' ? T.done : T.inProgress}</span>}
          </h4>
          <RichText text={pt.content} />
        </div>
      </div>
    );
  };
  const AgrHead = () => (
    <colgroup><col style={{ width: '28%' }} /><col style={{ width: '15%' }} /><col /><col style={{ width: '14%' }} /></colgroup>
  );
  const AgrThead = () => (
    <thead><tr><th>{T.colAgreement}</th><th>{T.colDate}</th><th>{T.colSummary}</th><th className="c">{T.colStatus}</th></tr></thead>
  );
  const renderAgreementRow = (i: number) => {
    const a = agreements[i];
    const st = agreementStatus(a);
    return (
      <tr>
        <td><div className="ttl">{a.title}</div>{a.party && <div style={{ marginTop: '1.5mm' }}><PartyBadge party={a.party} /></div>}</td>
        <td>{formatDayDate(a.date, lang) || DASH}</td>
        <td><RichText text={a.summary} /></td>
        <td className="c"><span className={`rpt-status ${st.cls}`}>{st.label}</span></td>
      </tr>
    );
  };

  /* ---------- Measured pagination ---------- */
  type Plan = Record<'int' | 'pts' | 'upd' | 'agr', number[][]>;
  const fallbackPlan = (): Plan => ({
    int: chunkFixed(interactions, 4), pts: chunkFixed(points, 3), upd: chunkFixed(updates, 3), agr: chunkFixed(agreements, 5),
  });
  const [plan, setPlan] = useState<Plan>(fallbackPlan);
  const measureRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const body = root.querySelector<HTMLElement>('[data-m="body"]');
    if (!body) return;
    const avail = body.clientHeight - 6; // small safety margin
    const h = (sel: string) => root.querySelector<HTMLElement>(sel)?.offsetHeight || 0;
    const pack = (key: string, count: number, extraFirst = 0, extraEach = 0): number[][] => {
      const first = h(`[data-m="${key}-h1"]`) + extraFirst;
      const cont = h(`[data-m="${key}-h2"]`) + extraFirst;
      const pages: number[][] = [];
      let cur: number[] = [];
      let used = first + extraEach;
      for (let i = 0; i < count; i++) {
        const ih = h(`[data-m="${key}-i${i}"]`);
        if (cur.length && used + ih > avail) { pages.push(cur); cur = []; used = cont + extraEach; }
        cur.push(i); used += ih;
      }
      if (cur.length) pages.push(cur);
      return pages;
    };
    const next: Plan = {
      int: pack('int', interactions.length),
      pts: pack('pts', points.length),
      upd: pack('upd', updates.length),
      agr: pack('agr', agreements.length, 0, h('[data-m="agr-thead"]')),
    };
    setPlan(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [interactions.length, points.length, updates.length, agreements.length]);

  const dataKey = JSON.stringify(data) + lang;
  useLayoutEffect(() => { measure(); }, [dataKey, measure]);
  useEffect(() => {
    (document as any).fonts?.ready?.then(() => measure());
  }, [measure]);

  /* ---------- Page definitions ---------- */
  type PageDef = { key: string; section: SectionKey; toc?: { no: string; title: string }; cls?: string; render: () => React.ReactNode };
  const pages: PageDef[] = [];
  let secNo = 0;
  const nextNo = () => String(++secNo).padStart(2, '0');

  /* 01 Executive summary */
  if (on('summary') && ['summary.kpis', 'summary.text', 'summary.objectives', 'summary.last'].some(on)) {
    const s = { no: nextNo(), title: T.summary };
    pages.push({
      key: 'summary', section: 'summary', toc: s, render: () => (
        <>
          <Section no={s.no} title={s.title} lede={T.summaryLede} />
          {on('summary.kpis') && <div className="rpt-kgrid c3">
            <KBox lead label={T.totalWorkforce} value={totalWorkers ? Number(totalWorkers).toLocaleString('en-US') : DASH} />
            <KBox ent={T.entMohre} label={T.catAllMohre} value={mohreWorkers + mohreDomestic ? (mohreWorkers + mohreDomestic).toLocaleString('en-US') : DASH} />
            <KBox ent={T.entIcp} label={T.catWorkers} value={fmtInt(icpRaw)} />
            <KBox label={T.glanceProtected} value={fmtPct(mohre.wpsWageTransferPct)} />
            <KBox label={T.glanceAgreements} value={activeAgreements} />
            <KBox label={T.glanceLast} value={latestEngagement || DASH} small />
          </div>}

          {/* Summary text: shown only when written (no placeholder in the report) */}
          {on('summary.text') && data.executiveSummary?.trim() && <div className="rpt-summary-text">
            <RichText text={data.executiveSummary} />
          </div>}

          {/* Main objectives of this meeting (user input) */}
          {on('summary.objectives') && objectives.length > 0 && (
            <div>
              <Section sub title={T.objectives} />
              <ol className="rpt-objectives">
                {objectives.map((o, i) => <li key={i}><span className="n num">{i + 1}</span><span className="t">{o}</span></li>)}
              </ol>
            </div>
          )}

          {/* Last interactions: up to two meetings or letters (user input) */}
          {on('summary.last') && lastInts.length > 0 && (
            <div>
              <Section sub title={T.lastInteractions} />
              <div className="rpt-lastints">
                {lastInts.map((x, i) => (
                  <div key={i} className="li">
                    <div className="top">
                      <span className={`kind ${x.kind === 'letter' ? 'letter' : 'meeting'}`}>{x.kind === 'letter' ? T.kindLetter : T.kindMeeting}</span>
                      <span className={`rpt-status ${x.status === 'done' ? 'ok' : 'warn'}`}>{x.status === 'done' ? T.stDone : T.stPending}</span>
                    </div>
                    <div className="date">{formatDayDate(x.date, lang) || DASH}</div>
                    <div className="ttl">{x.title}</div>
                    {x.brief?.trim() && <div className="brief">{x.brief}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ),
    });
  }

  /* 02 Profile & economy */
  if (on('profile') && ['profile.facts', 'profile.economy', 'profile.trade', 'profile.education'].some(on)) {
    const s = { no: nextNo(), title: T.profile };
    pages.push({
      key: 'profile', section: 'profile', toc: s, render: () => (
        <>
          <Section no={s.no} title={s.title} lede={T.profileLede} />
          {on('profile.facts') && <div className="rpt-facts">
            <Fact label={T.capital} value={data.capital} />
            <Fact label={T.population} value={data.population} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.currency} value={data.currency} />
            <Fact label={T.hdi} value={data.hdi} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.government} value={data.governmentType} />
            <Fact label={T.labourAuthority} value={data.workforceMinistry} />
            <Fact label={T.language} value={data.officialLanguage} />
            <Fact label={T.flights} value={data.directFlight ? T.yes : T.no} />
            <Fact label={T.nationalsInUae} value={!isBlank(data.totalWorkersInUae) ? fmtInt(data.totalWorkersInUae) : (totalWorkers ? Number(totalWorkers).toLocaleString('en-US') : '')} />
            <Fact label={T.unemployment} value={data.unemploymentRate} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.literacy} value={data.literacyRate} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.crime} value={data.crimeRate} source={<Src k="wb" year={reportYear} />} />
          </div>}

          {on('profile.economy') && <><Section sub title={T.economy} />
          <div className="rpt-facts">
            <Fact label={T.gdp} value={data.gdp} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.inflation} value={data.economicStats.inflation} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.remittances} value={data.economicStats.remittancesFromUAE} source={<Src k="cbuae" year={prevYear} />} />
            <Fact label={T.tip} value={data.economicStats.tipRank} tone="warn" source={<Src k="tip" year={prevYear} />} />
          </div></>}
          {on('profile.trade') && <div className="rpt-panel soft rpt-mt">
            <h3>{T.tradeTitle} <Src k="comtrade" year={reportYear} /></h3>
            <div className="rpt-trade">
              <div>
                <div className="dir">{T.uaeExportsTo(country)}</div>
                <div className="amt">{show(data.economicStats.totalImportsFromUAE)}</div>
                <div className="items">{(data.economicStats.topImportProducts || []).filter(Boolean).join(isRTL ? '، ' : ' · ') || DASH}</div>
              </div>
              <div>
                <div className="dir">{T.uaeImportsFrom(country)}</div>
                <div className="amt">{show(data.economicStats.totalExportsToUAE)}</div>
                <div className="items">{(data.economicStats.topExportProducts || []).filter(Boolean).join(isRTL ? '، ' : ' · ') || DASH}</div>
              </div>
            </div>
          </div>}

          {on('profile.education') && <><Section sub title={T.education} />
          <div className="rpt-grid3" style={{ alignItems: 'start' }}>
            <div className="rpt-facts" style={{ gridTemplateColumns: '1fr' }}>
              <Fact label={T.tertiary} value={data.educationStats.higherEducationEnrollment} source={<Src k="unesco" year={reportYear} />} />
            </div>
            <div className="rpt-facts" style={{ gridTemplateColumns: '1fr' }}>
              <Fact label={T.primary} value={data.educationStats.primaryEnrollment} source={<Src k="unesco" year={reportYear} />} />
            </div>
            <div>
              <div className="rpt-fact" style={{ borderBottom: 0, paddingBottom: '1mm', borderTop: '1px solid var(--line)' }}><div className="lbl">{T.universities}</div></div>
              {(data.educationStats.topUniversities || []).filter(Boolean).length ? (
                <ol className="rpt-ol">{data.educationStats.topUniversities.filter(Boolean).slice(0, 5).map((u, i) => <li key={i}>{u}</li>)}</ol>
              ) : <div className="rpt-empty">{T.noData}</div>}
            </div>
          </div></>}
        </>
      ),
    });
  }

  /* 03 UAE workforce — three pages (overview · distribution · wages) */
  const showUae = on('uae');
  const uae1 = showUae && ['uae.kpis', 'uae.trend', 'uae.protection'].some(on);
  const uae2 = showUae && ['uae.distTakeaways', 'uae.emirates', 'uae.sectors'].some(on);
  const uae3 = showUae && ['uae.wageTakeaways', 'uae.wagesSkill', 'uae.wagesSector'].some(on) && (hasWageTable || salary.length > 0);
  const secUae = { no: (uae1 || uae2 || uae3) ? nextNo() : '', title: T.uaeWorkforce };
  const uaeToc = (first: boolean) => (first ? secUae : undefined);
  if (showUae) {
    const s = secUae;
    const protectionRows = [
      { label: T.unempIns, cn: mohre.insuranceUnemploymentCoveredNum, cp: mohre.insuranceUnemploymentCoveredPct, nn: mohre.insuranceUnemploymentExposedNum, np: mohre.insuranceUnemploymentExposedPct },
      { label: T.rightsIns, cn: mohre.insuranceRightsCoveredNum, cp: mohre.insuranceRightsCoveredPct, nn: mohre.insuranceRightsExposedNum, np: mohre.insuranceRightsExposedPct },
      { label: T.wps, cn: mohre.wpsWageTransferNum, cp: mohre.wpsWageTransferPct, nn: undefined, np: undefined },
    ];
    if (uae1) pages.push({
      key: 'uae-1', section: 'uae', toc: uaeToc(true), cls: 'rpt-big rpt-big2', render: () => (
        <>
          <Section no={s.no} title={s.title} lede={T.uaeWorkforceLede(country, dataAsOf)} />
          {on('uae.kpis') && <div className="rpt-kgrid c4">
            <KBox lead label={T.totalWorkforce} value={totalWorkers ? Number(totalWorkers).toLocaleString('en-US') : DASH} />
            <KBox ent={T.entMohre} label={T.catWorkers} value={fmtInt(mohre.totalPrivate?.value)} />
            <KBox ent={T.entMohre} label={T.catDomestic} value={fmtInt(mohre.totalDomestic?.value)} />
            <KBox ent={T.entIcp} label={T.catWorkers} value={fmtInt(icpRaw)} />
          </div>}

          {on('uae.trend') && trend.length > 0 && (
            <div className="rpt-panel rpt-mt">
              <h3>{T.trendTitle} <Src k="mohre" /></h3>
              <TrendFigures points={trend} T={T} />
            </div>
          )}

          {on('uae.protection') && <div className="rpt-panel rpt-mt">
            <h3>{T.protection} <Src k="mohre" year={dataAsOf} /></h3>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>{T.indicator}</th>
                  <th className="r">{T.covered}</th>
                  <th className="r">%</th>
                  <th className="r">{T.notCovered}</th>
                  <th className="r">%</th>
                  <th style={{ width: '26mm' }}>{T.share}</th>
                </tr>
              </thead>
              <tbody>
                {protectionRows.map((r, i) => {
                  const a = pctNum(r.cp);
                  const b = r.np !== undefined ? pctNum(r.np) : (a !== null ? 100 - a : null);
                  return (
                    <tr key={i}>
                      <td className="strong">{r.label}</td>
                      <td className="r num">{fmtInt(r.cn)}</td>
                      <td className="r num pct-ok">{fmtPct(r.cp)}</td>
                      <td className="r num">{r.nn === undefined ? '' : fmtInt(r.nn)}</td>
                      <td className="r num pct-warn">{r.np === undefined ? '' : fmtPct(r.np)}</td>
                      <td>{a !== null ? <div className="rpt-split"><span className="a" style={{ width: `${a}%` }} /><span className="b" style={{ width: `${b ?? 0}%` }} /></div> : null}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="strong">{T.strikes}</td>
                  <td className="r num strong">{fmtInt(mohre.workersLaborStrikes || '0')}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>}

        </>
      ),
    });
    if (uae2) pages.push({
      key: 'uae-2', section: 'uae', toc: uaeToc(!uae1), cls: 'rpt-big rpt-big2', render: () => (
        <>
          <Section no={s.no} title={uae1 ? `${s.title} ${T.continued}` : s.title} lede={T.uaeCont} />
          {/* Key takeaways */}
          {on('uae.distTakeaways') && (topEmirate || topSector || top3) && (
            <div className="rpt-takeaways">
              {topEmirate && (
                <div><div className="k">{T.tkEmirate}</div><div className="v">{topEmirate.name}</div><div className="s"><span className="num">{topEmirate.pct}%</span> {T.tkOfMohre}</div></div>
              )}
              {topSector && (
                <div><div className="k">{T.tkSector}</div><div className="v">{topSector.name}</div><div className="s"><span className="num">{topSector.pct}%</span> {T.tkOfMohre}</div></div>
              )}
              {top3 && (
                <div><div className="k">{T.tkTop3}</div><div className="v num">{top3.pct}%</div><div className="s">{T.tkOfMohre} · {top3.names}</div></div>
              )}
            </div>
          )}

          {/* Workers by emirate — MOHRE and ICP side by side */}
          {on('uae.emirates') && <div className="rpt-panel rpt-mt">
            <h3>{T.byEmirate}<Src k="mohreIcp" year={dataAsOf} /></h3>
            <table className="rpt-dist">
              <colgroup><col style={{ width: '22%' }} /><col /><col /></colgroup>
              <thead><tr><th>{T.emirateCol}</th><th><i className="key m" />{T.mohreShortSub}</th><th><i className="key i" />{T.icpWorkers}</th></tr></thead>
              <tbody>
                {emirateRows.map(r => (
                  <tr key={r.key}>
                    <td className="nm">{r.name}</td>
                    <td><DistCell v={r.mohre} max={emMax} total={sumMohre} tone="m" /></td>
                    <td><DistCell v={r.icp} max={emMax} total={sumIcp} tone="i" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}

          {/* Workers by sector */}
          {on('uae.sectors') && (mohreSectors.length > 0 || icpSectors.length > 0) && (
            <div className="rpt-panel rpt-mt">
              <h3>{icpSectors.length ? T.bySector : T.bySectorMohre}<Src k={icpSectors.length ? 'mohreIcp' : 'mohre'} year={dataAsOf} /></h3>
              {icpSectors.length ? (
                /* MOHRE and ICP classify sectors differently: one aligned table, each side ranked by its own sectors */
                (() => {
                  const mList = topWithOther(mohre.bySector, 6), iList = topWithOther(uae.icp.bySector || [], 6);
                  const mMax = Math.max(...mList.map(x => x.value), 1), iMax = Math.max(...iList.map(x => x.value), 1);
                  const rows = Math.max(mList.length, iList.length);
                  return (
                    <table className="rpt-dist sec2">
                      <colgroup><col style={{ width: '21%' }} /><col style={{ width: '29%' }} /><col style={{ width: '21%' }} /><col style={{ width: '29%' }} /></colgroup>
                      <thead><tr>
                        <th colSpan={2}><i className="key m" />{T.mohreShortSub}</th>
                        <th colSpan={2} className="split"><i className="key i" />{T.icpWorkers}</th>
                      </tr></thead>
                      <tbody>{Array.from({ length: rows }, (_, k) => {
                        const m = mList[k], c = iList[k];
                        return (
                          <tr key={k}>
                            <td className="nm">{m?.name || ''}</td>
                            <td>{m ? <DistCell v={m.value} max={mMax} total={secTotalM} tone="m" /> : null}</td>
                            <td className="nm split">{c?.name || ''}</td>
                            <td>{c ? <DistCell v={c.value} max={iMax} total={secTotalI} tone="i" /> : null}</td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  );
                })()
              ) : (
                <div className="rpt-dist-cols">
                  {[sectorRows.slice(0, Math.ceil(sectorRows.length / 2)), sectorRows.slice(Math.ceil(sectorRows.length / 2))].map((col, ci) => (
                    <table key={ci} className="rpt-dist">
                      <colgroup><col style={{ width: '44%' }} /><col /></colgroup>
                      <tbody>{col.map(r => (
                        <tr key={r.name}><td className="nm">{r.name}</td><td><DistCell v={r.mohre} max={secMax} total={secTotalM} tone="m" /></td></tr>
                      ))}</tbody>
                    </table>
                  ))}
                </div>
              )}
            </div>
          )}

        </>
      ),
    });
  }

  /* 03 continued — Wages */
  if (uae3) {
    pages.push({
      key: 'uae-3', section: 'uae', toc: uaeToc(!uae1 && !uae2), cls: 'rpt-big rpt-big2', render: () => (
        <>
          <Section no={secUae.no} title={uae1 || uae2 ? `${secUae.title} ${T.continued}` : secUae.title} lede={T.wagesLede(country)} />
          {on('uae.wageTakeaways') && avgGap !== null && (
            <div className="rpt-takeaways">
              <div className={avgGap < 0 ? 'neg' : 'pos'}><div className="k">{T.tkWage}</div><div className="v num">{avgGap > 0 ? `+${avgGap}` : avgGap}%</div><div className="s">{T.tkWageSub(gapBelow, salaryBoth.length)}</div></div>
              {widest && <div className="neg"><div className="k">{T.tkWidest}</div><div className="v">{widest.name}</div><div className="s"><span className="num">{widest.gap}%</span> · <span className="num">{widest.partner.toLocaleString('en-US')}</span> {T.vs} <span className="num">{widest.market.toLocaleString('en-US')}</span> {T.aed}</div></div>}
              {closest && <div className="pos"><div className="k">{T.tkClosest}</div><div className="v">{closest.name}</div><div className="s"><span className="num">{closest.gap}%</span> · <span className="num">{closest.partner.toLocaleString('en-US')}</span> {T.vs} <span className="num">{closest.market.toLocaleString('en-US')}</span> {T.aed}</div></div>}
            </div>
          )}
          {on('uae.wagesSkill') && hasWageTable && (
            <div className="rpt-panel rpt-mt">
              <h3>{T.wagesBySkill}</h3>
              <table className="rpt-table">
                <thead><tr><th>{T.skillLevel}</th><th className="r">{T.nationals(country)}</th><th className="r">{T.market}</th><th className="r">{T.gap}</th></tr></thead>
                <tbody>
                  <tr><td className="strong">{T.skilled}</td><td className="r numx">{withAed(mohre.skilledPartnerWage, lang)}</td><td className="r numx">{withAed(mohre.skilledUaeWage, lang)}</td><td className="r num strong">{wageGap(mohre.skilledPartnerWage, mohre.skilledUaeWage)}</td></tr>
                  <tr><td className="strong">{T.unskilled}</td><td className="r numx">{withAed(mohre.unskilledPartnerWage, lang)}</td><td className="r numx">{withAed(mohre.unskilledUaeWage, lang)}</td><td className="r num strong">{wageGap(mohre.unskilledPartnerWage, mohre.unskilledUaeWage)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {on('uae.wagesSector') && salary.length > 0 && (
            <div className="rpt-panel rpt-mt">
              <h3>{T.salaryTitle(country)}</h3>
              <p className="rpt-note" style={{ marginTop: '-1mm', marginBottom: '2.5mm' }}>{T.salaryHow(country)}</p>
              <table className="rpt-wages">
                <colgroup><col style={{ width: '24%' }} /><col /><col /><col style={{ width: '17%' }} /></colgroup>
                <thead>
                  <tr>
                    <th>{T.sectorCol}</th>
                    <th><i className="key m" />{T.marketMedian}</th>
                    <th><i className="key p" />{T.nationals(country)}</th>
                    <th className="c">{T.gap}</th>
                  </tr>
                </thead>
                <tbody>
                  {salary.map((sl, i) => {
                    const d = sl.market && sl.partner ? Math.round(((sl.partner - sl.market) / sl.market) * 100) : null;
                    return (
                      <tr key={i}>
                        <td className="sec">{sl.name}</td>
                        <td><div className="wbar"><span className="t"><span className="f m" style={{ width: `${(sl.market / salaryMax) * 100}%` }} /></span><span className="v num">{sl.market ? sl.market.toLocaleString('en-US') : DASH}</span></div></td>
                        <td><div className="wbar"><span className="t"><span className="f p" style={{ width: `${(sl.partner / salaryMax) * 100}%` }} /></span><span className="v num">{sl.partner ? sl.partner.toLocaleString('en-US') : DASH}</span></div></td>
                        <td className="c">{d === null ? DASH : <span className={`gapchip ${d < 0 ? 'below' : 'above'}`}><span className="num">{d > 0 ? `+${d}` : d}%</span></span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ),
    });
  }

  /* 04 Partner workforce */
  if (on('partner') && ['partner.facts', 'partner.gender', 'partner.destinations', 'partner.sectors', 'partner.skills'].some(on)) {
    const s = { no: nextNo(), title: T.partnerWorkforce(country) };
    const male = Number(data.workforceStats.participationMale) || 0;
    const female = Number(data.workforceStats.participationFemale) || 0;
    pages.push({
      key: 'partner', section: 'partner', toc: s, render: () => (
        <>
          <Section no={s.no} title={s.title} lede={T.partnerLede} />
          {on('partner.facts') && <div className="rpt-facts c3">
            <Fact label={T.labourForce} value={data.workforceStats.totalWorkforce} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.avgWage} value={data.averageWage} source={<Src k="wb" year={reportYear} />} />
            <Fact label={T.minWage} value={data.minimumWage} />
          </div>}
          {on('partner.gender') && <div className="rpt-panel rpt-gender rpt-mt">
            <h3>{T.gender} <Src k="wb" year={reportYear} /></h3>
            {male || female ? (
              <div className="rpt-grid2" style={{ columnGap: '10mm' }}>
                {[{ k: T.men, v: male, c: 'm' }, { k: T.women, v: female, c: 'w' }].map(g => (
                  <div key={g.c}>
                    <div className="keys"><span>{g.k}</span><b className="num">{g.v}%</b></div>
                    <div className="bar"><span className={g.c} style={{ width: `${Math.min(g.v, 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            ) : <div className="rpt-empty">{T.noData}</div>}
          </div>}
          {(on('partner.destinations') || on('partner.sectors')) && <div className={on('partner.destinations') && on('partner.sectors') ? 'rpt-grid2 rpt-mt' : 'rpt-mt'}>
            {on('partner.destinations') && <div className="rpt-panel">
              <h3>{T.destinations}</h3>
              <BarList wide raw tone="gold" emptyText={T.noData}
                items={data.workforceStats.migrationDestinations.map(d => ({ name: d.country, value: toNumber(d.count) ?? 0, label: d.count })).sort((a, b) => b.value - a.value).slice(0, 6)} />
            </div>}
            {on('partner.sectors') && <div className="rpt-panel">
              <h3>{T.sectors}</h3>
              <BarList wide raw emptyText={T.noData}
                items={data.workforceStats.topSectors.map(x => ({ name: sector(x.name), value: Number(x.value) || 0 })).sort((a, b) => b.value - a.value).slice(0, 6)} />
            </div>}
          </div>}
          {on('partner.skills') && <div className="rpt-panel soft rpt-mt">
            <h3>{T.skills}</h3>
            {data.workforceStats.availableSkills.filter(Boolean).length ? (
              <div className="rpt-chips">{data.workforceStats.availableSkills.filter(Boolean).slice(0, 14).map((sk, i) => <span key={i} className="rpt-chip">{sk}</span>)}</div>
            ) : <div className="rpt-empty">{T.noData}</div>}
            <p className="rpt-note">{T.skillsNote}</p>
          </div>}
        </>
      ),
    });
  }

  /* Flowing sections */
  const relLede = interactions.length ? `${T.relationshipLede} · ${T.relCount(interactions.length, nMohre, nGov)}` : T.relationshipLede;
  const flowSection = (
    planKey: keyof Plan, section: SectionKey, title: string, lede: string,
    body: (idx: number[]) => React.ReactNode,
  ) => {
    if (hidden.has(section)) return;
    const chunks = plan[planKey];
    if (!chunks.length) return;
    const s = { no: nextNo(), title };
    chunks.forEach((idx, p) => pages.push({
      key: `${planKey}-${p}`, section, toc: p === 0 ? s : undefined, render: () => (
        <>
          <Section no={s.no} title={p === 0 ? title : `${title} ${T.continued}`} lede={p === 0 ? lede : undefined} />
          {body(idx)}
        </>
      ),
    }));
  };
  flowSection('int', 'relationship', T.relationship, relLede, idx => (
    <div className="rpt-entries">{idx.map(i => <React.Fragment key={i}>{renderInteraction(i)}</React.Fragment>)}</div>
  ));
  flowSection('pts', 'points', T.points, T.pointsLede, idx => (
    <div className="rpt-points">{idx.map(i => <React.Fragment key={i}>{renderPoint(points, false)(i)}</React.Fragment>)}</div>
  ));
  flowSection('upd', 'updates', T.updates, T.updatesLede, idx => (
    <div className="rpt-points">{idx.map(i => <React.Fragment key={i}>{renderPoint(updates, true)(i)}</React.Fragment>)}</div>
  ));
  if (hidden.has('agreements')) {
    /* section hidden */
  } else if (plan.agr.length) {
    flowSection('agr', 'agreements', T.agreements, T.agreementsLede, idx => (
      <table className="rpt-table rpt-agr"><AgrHead /><AgrThead /><tbody>{idx.map(i => <React.Fragment key={i}>{renderAgreementRow(i)}</React.Fragment>)}</tbody></table>
    ));
  } else {
    const s = { no: nextNo(), title: T.agreements };
    pages.push({ key: 'agr-empty', section: 'agreements', toc: s, render: () => (<><Section no={s.no} title={s.title} /><div className="rpt-placeholder">{T.noAgreements}</div></>) });
  }

  /* Delegations — partner side only, with "met before" */
  if (!hidden.has('delegations')) {
    const s = { no: nextNo(), title: T.delegations };
    const members = data.delegations.partner || [];
    const Delegate = ({ d }: { d: any }) => (
      <div className="rpt-dele">
        <div className="photo">{d.imageUrl ? <img src={d.imageUrl} alt={d.name} /> : null}</div>
        <div>
          <div className="name">{d.name || DASH}</div>
          <div className="role">{d.title}</div>
          {(d.metBefore || d.metShow !== false) && <div className={`rpt-met ${d.metBefore ? 'yes' : 'no'}`}>
            <span className="k">{T.metBefore}</span>
            <span className="v">{d.metBefore ? T.metYes(d.metWhen ? (/^\d{4}-\d{2}/.test(d.metWhen) ? formatDayDate(d.metWhen, lang) : d.metWhen) : '') : T.metNo}</span>
          </div>}
          <RichText text={d.bio} />
        </div>
      </div>
    );
    const groups = members.length ? chunkFixed(members, 3) : [[]];
    groups.forEach((idx, p) => pages.push({
      key: `dele-${p}`, section: 'delegations', toc: p === 0 ? s : undefined, render: () => (
        <>
          <Section no={s.no} title={p === 0 ? s.title : `${s.title} ${T.continued}`} lede={p === 0 ? T.delegationsLede : undefined} />
          <div className="rpt-side">{flag && <img src={flag} alt="" />}{T.partnerDelegation(country)}</div>
          {idx.length ? idx.map(i => <Delegate key={members[i].id || i} d={members[i]} />) : <div className="rpt-empty">{T.noData}</div>}
        </>
      ),
    }));
  }

  const totalPages = pages.length + 1;
  const toc = pages.map((p, i) => (p.toc ? { ...p.toc, page: i + 2 } : null)).filter(Boolean) as { no: string; title: string; page: number }[];

  /* ---------- Overflow report (fixed pages) ---------- */
  useLayoutEffect(() => {
    if (!onOverflow || !rootRef.current) return;
    const bodies = rootRef.current.querySelectorAll<HTMLElement>('section.rpt-page[data-page] .rpt-body');
    const bad: number[] = [];
    bodies.forEach(b => {
      const over = b.scrollHeight - b.clientHeight > 2;
      b.parentElement?.classList.toggle('rpt-overflow', over);
      if (over) bad.push(Number(b.parentElement?.getAttribute('data-page')));
    });
    onOverflow(bad);
  });

  const RunningHead = () => (
    <div className="rpt-head">
      <div className="left">
        {flag && <img className="flag" src={flag} alt="" />}
        <div style={{ minWidth: 0 }}>
          <div className="kicker">{T.reportTitle}</div>
          <div className="title">{country}</div>
        </div>
      </div>
      <div className="right">
        <span className="rpt-class"><ShieldAlert size={10} />{T.restricted}</span>
        <span className="ref num">{report.id}</span>
      </div>
    </div>
  );
  const Foot = ({ n }: { n: number }) => (
    <div className="rpt-foot">
      <span>{T.ministry} · {T.dept}</span>
      <span>{T.generated} {issuedOn}</span>
      <span className="pg">{T.page(n, totalPages)}</span>
    </div>
  );

  const hideBroken = (e: React.SyntheticEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'IMG') (t as HTMLImageElement).style.visibility = 'hidden';
  };

  return (
    <div className="rpt rpt-doc" dir={dir} lang={lang} ref={rootRef} onErrorCapture={hideBroken}>
      {/* Hidden measuring pass for flowing sections */}
      <div ref={measureRef} className="rpt-measure" aria-hidden="true">
        <section className="rpt-page"><RunningHead /><div className="rpt-body" data-m="body" /><Foot n={1} /></section>
        <div className="rpt-measure-body">
          <div data-m="int-h1" className="m"><Section no="00" title={T.relationship} lede={relLede} /></div>
          <div data-m="int-h2" className="m"><Section no="00" title={`${T.relationship} ${T.continued}`} /></div>
          <div className="rpt-entries">{interactions.map((_, i) => <div key={i} data-m={`int-i${i}`} className="m">{renderInteraction(i)}</div>)}</div>
          <div data-m="pts-h1" className="m"><Section no="00" title={T.points} lede={T.pointsLede} /></div>
          <div data-m="pts-h2" className="m"><Section no="00" title={`${T.points} ${T.continued}`} /></div>
          <div className="rpt-points">{points.map((_, i) => <div key={i} data-m={`pts-i${i}`} className="m">{renderPoint(points, false)(i)}</div>)}</div>
          <div data-m="upd-h1" className="m"><Section no="00" title={T.updates} lede={T.updatesLede} /></div>
          <div data-m="upd-h2" className="m"><Section no="00" title={`${T.updates} ${T.continued}`} /></div>
          <div className="rpt-points">{updates.map((_, i) => <div key={i} data-m={`upd-i${i}`} className="m">{renderPoint(updates, true)(i)}</div>)}</div>
          <div data-m="agr-h1" className="m"><Section no="00" title={T.agreements} lede={T.agreementsLede} /></div>
          <div data-m="agr-h2" className="m"><Section no="00" title={`${T.agreements} ${T.continued}`} /></div>
          <table className="rpt-table rpt-agr" data-m="agr-thead"><AgrHead /><AgrThead /></table>
          {agreements.map((_, i) => (
            <table key={i} className="rpt-table rpt-agr" data-m={`agr-i${i}`}><AgrHead /><tbody>{renderAgreementRow(i)}</tbody></table>
          ))}
        </div>
      </div>

      {/* COVER */}
      <section className="rpt-page" data-section="cover">
        <div className="rpt-cover">
          <div className="mast">
            <div className="en">{COPY.en.ministry}<div className="dept">{COPY.en.dept}</div></div>
            <div className="ar">{COPY.ar.ministry}<div className="dept">{COPY.ar.dept}</div></div>
          </div>
          <div className="goldrule" />
          <div className="main">
            <div className="eyebrow">{T.eyebrow}</div>
            <h1>{T.reportTitle}</h1>
            <div className="subtitle">{T.subtitle(country)}</div>
            <div className="country">
              {flag ? <img src={flag} alt="" /> : <span className="noflag" />}
              <div className="name">{officialName}</div>
            </div>
            <div className="meta">
              <div><div className="lbl">{T.reference}</div><div className="val num">{report.id}</div></div>
              <div><div className="lbl">{T.reportDate}</div><div className="val">{formatDayDate(data.reportDate || '', lang) || DASH}</div></div>
              <div><div className="lbl">{T.preparedBy}</div><div className="val">{T.dept}</div></div>
              <div><div className="lbl">{T.classification}</div><div className="val"><span className="rpt-class"><ShieldAlert size={10} />{T.restrictedLong}</span></div></div>
            </div>
            <div className="toc">
              <h3>{T.contents}</h3>
              <ol>
                {toc.map(s => (
                  <li key={s.no}><span className="n num">{s.no}</span><span className="t">{s.title}</span><span className="p num">{s.page}</span></li>
                ))}
              </ol>
            </div>
          </div>
          <div className="bottom">
            <span>{T.ministry}</span>
            <span>{T.generated} {issuedOn}</span>
          </div>
        </div>
      </section>

      {pages.map((p, i) => (
        <section key={p.key} className={`rpt-page ${p.cls || ''}`} data-section={p.section} data-page={i + 2}>
          <RunningHead />
          <div className="rpt-body">{p.render()}</div>
          <Foot n={i + 2} />
        </section>
      ))}
    </div>
  );
}
