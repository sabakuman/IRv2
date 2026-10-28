/*
 * Lets the new builder and the new report read reports made in the classic wizard.
 * It only fills a new-design field when that field is still empty, so nothing the
 * classic wizard saved is changed or removed, and both screens can edit the same report.
 */

const SECTION_MAP: Record<string, string> = {
  executiveBrief: 'summary', profileEconomy: 'profile', uaeWorkforce: 'uae', partnerWorkforce: 'partner',
  interactions: 'relationship', discussionPoints: 'points', previousUpdates: 'updates',
  agreements: 'agreements', delegation: 'delegations',
  demographics: 'profile.facts', economicLandscape: 'profile.economy', bilateralTrade: 'profile.trade',
  educationInsights: 'profile.education', uaeWorkforceKpis: 'uae.kpis', threeYearTrend: 'uae.trend',
  insuranceExposures: 'uae.protection', emiratesDistribution: 'uae.emirates', sectorsChart: 'uae.sectors',
  salaryChart: 'uae.wagesSector', partnerWorkforceKpis: 'partner.facts', migrationDestinations: 'partner.destinations',
  partnerSectors: 'partner.sectors', availableSkills: 'partner.skills',
};

const empty = (v: any) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

export function fromClassic<T = any>(input: T): T {
  if (!input || typeof input !== 'object') return input;
  const d: any = { ...(input as any) };

  if (empty(d.executiveSummary) && typeof d.summary === 'string' && d.summary.trim()) d.executiveSummary = d.summary;

  if (empty(d.meetingObjectives)) {
    const fromGoal = typeof d.meetingGoal === 'string' ? d.meetingGoal.split(/\n+/).map((s: string) => s.trim()).filter(Boolean) : [];
    const fromFocus = Array.isArray(d.pointsToFocusOn) ? d.pointsToFocusOn.filter((s: any) => typeof s === 'string' && s.trim()) : [];
    const list = fromGoal.length ? fromGoal : fromFocus;
    if (list.length) d.meetingObjectives = list.slice(0, 6);
  }

  if (Array.isArray(d.recentInteractions)) {
    d.recentInteractions = d.recentInteractions.map((i: any) => {
      if (!i || i.party) return i;
      const c = String(i.category || '').toUpperCase();
      if (c === 'MOHRE') return { ...i, party: 'mohre' };
      if (c === 'UAE GOV') return { ...i, party: 'uae_gov' };
      return i;
    });
  }

  if (d.delegations && typeof d.delegations === 'object') {
    const fix = (list: any) => Array.isArray(list) ? list.map((p: any) => {
      if (!p || !empty(p.metWhen)) return p;
      const when = [p.meetingYear, p.meetingLocation].filter((s: any) => s && String(s).trim()).join(' · ');
      return when ? { ...p, metWhen: when } : p;
    }) : list;
    d.delegations = Object.fromEntries(Object.entries(d.delegations).map(([k, v]) => [k, fix(v)]));
  }

  const ws = d.uaeWorkforceStats;
  const h = ws?.workersHistory;
  const trendHasData = Array.isArray(ws?.trend) && ws.trend.some((p: any) => p && (p.privateSector || p.domestic || p.total));
  if (h && !trendHasData) {
    const pts = [
      { year: h.yearTwoYearsAgo, total: h.totalTwoYearsAgo },
      { year: h.yearPrevious, total: h.totalPrevious },
      { year: h.yearCurrent, total: h.totalCurrent },
    ].filter(p => p.year && typeof p.total === 'number');
    if (pts.length) d.uaeWorkforceStats = { ...ws, trend: pts.map(p => ({ year: String(p.year), total: p.total })) };
  }

  if (d.hiddenSections === undefined && d.sectionVisibility && typeof d.sectionVisibility === 'object') {
    d.hiddenSections = Object.entries(d.sectionVisibility)
      .filter(([k, v]) => v === false && SECTION_MAP[k])
      .map(([k]) => SECTION_MAP[k]);
  }

  return d as T;
}
