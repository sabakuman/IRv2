/* AI helpers for the report builder. All calls go through the server proxy (/api/ai/generate → Gemini). */
import { ReportData } from '../types';

type Lang = 'en' | 'ar';
type FieldType = 'string' | 'number' | 'boolean' | 'stringList' | 'nameValueList' | 'destinationList';

export interface AIField { path: string; type: FieldType; hint: string }

/* Page 2 — Country profile, economy, education (AI-fetched) */
export const PROFILE_FIELDS: AIField[] = [
  { path: 'countryOfficialName', type: 'string', hint: 'official long-form name of the country, e.g. "Republic of Kenya" / "جمهورية كينيا"' },
  { path: 'capital', type: 'string', hint: 'capital city' },
  { path: 'officialLanguage', type: 'string', hint: 'official language(s), comma separated' },
  { path: 'population', type: 'string', hint: 'total population, e.g. "56.4 million"' },
  { path: 'currency', type: 'string', hint: 'currency name with ISO code, e.g. "Kenyan shilling (KES)"' },
  { path: 'gdp', type: 'string', hint: 'nominal GDP in USD, e.g. "$116.3B"' },
  { path: 'hdi', type: 'string', hint: 'UNDP Human Development Index value only, e.g. "0.601"' },
  { path: 'crimeRate', type: 'string', hint: 'crime level: Low / Moderate / High (or intentional homicide rate per 100k)' },
  { path: 'literacyRate', type: 'string', hint: 'adult literacy rate, e.g. "82.6%"' },
  { path: 'governmentType', type: 'string', hint: 'system of government, e.g. "Presidential republic"' },
  { path: 'workforceMinistry', type: 'string', hint: 'official name of the ministry responsible for labour' },
  { path: 'directFlight', type: 'boolean', hint: 'true only if scheduled direct flights operate between the UAE and the country' },
  { path: 'unemploymentRate', type: 'string', hint: 'latest national unemployment rate, e.g. "5.6%"' },
  { path: 'economicStats.inflation', type: 'string', hint: 'latest annual CPI inflation, e.g. "4.1%"' },
  { path: 'economicStats.tipRank', type: 'string', hint: 'latest US Trafficking in Persons Report tier, e.g. "Tier 2"' },
  { path: 'economicStats.remittancesFromUAE', type: 'string', hint: 'annual remittances from the UAE to the country in USD, e.g. "$0.38B"' },
  { path: 'economicStats.totalImportsFromUAE', type: 'string', hint: 'annual value of UAE exports to the country (USD), e.g. "$2.84B"' },
  { path: 'economicStats.totalExportsToUAE', type: 'string', hint: 'annual value of UAE imports from the country (USD), e.g. "$0.21B"' },
  { path: 'economicStats.topImportProducts', type: 'stringList', hint: 'top 5 products the UAE exports to the country (1-3 words each)' },
  { path: 'economicStats.topExportProducts', type: 'stringList', hint: 'top 5 products the country exports to the UAE (1-3 words each)' },
  { path: 'educationStats.primaryEnrollment', type: 'string', hint: 'primary school net enrolment rate, e.g. "99%"' },
  { path: 'educationStats.higherEducationEnrollment', type: 'string', hint: 'tertiary gross enrolment ratio, e.g. "11%"' },
  { path: 'educationStats.topUniversities', type: 'stringList', hint: 'top 5 universities by national standing, official names' },
];

/* Page 4 — Partner labour market (AI-fetched) */
export const PARTNER_FIELDS: AIField[] = [
  { path: 'workforceStats.totalWorkforce', type: 'string', hint: 'total labour force, e.g. "24.8 million"' },
  { path: 'averageWage', type: 'string', hint: 'average monthly wage in USD, e.g. "$215"' },
  { path: 'minimumWage', type: 'string', hint: 'statutory minimum monthly wage in USD, e.g. "$120"' },
  { path: 'workforceStats.participationMale', type: 'number', hint: 'male labour force participation rate, 0-100' },
  { path: 'workforceStats.participationFemale', type: 'number', hint: 'female labour force participation rate, 0-100' },
  { path: 'workforceStats.migrationDestinations', type: 'destinationList', hint: 'up to 5 main destination countries for the country\'s migrant workers, with number of nationals working there as text, e.g. "215,000"' },
  { path: 'workforceStats.topSectors', type: 'nameValueList', hint: 'up to 6 sectors with share of national employment in %' },
  { path: 'workforceStats.availableSkills', type: 'stringList', hint: '6-10 short occupational categories available for overseas employment' },
];

const keyOf = (path: string) => path.replace(/\./g, '__');

const schemaFor = (t: FieldType): any => {
  switch (t) {
    case 'string': return { type: 'STRING' };
    case 'number': return { type: 'NUMBER' };
    case 'boolean': return { type: 'BOOLEAN' };
    case 'stringList': return { type: 'ARRAY', items: { type: 'STRING' } };
    case 'nameValueList': return { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, value: { type: 'NUMBER' } } } };
    case 'destinationList': return { type: 'ARRAY', items: { type: 'OBJECT', properties: { country: { type: 'STRING' }, count: { type: 'STRING' } } } };
  }
};

async function callAI(prompt: string, responseSchema: any, apiKey: string): Promise<any> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-apikey': apiKey || '' },
    body: JSON.stringify({ prompt, model: 'gemini-3.5-flash', config: { responseMimeType: 'application/json', responseSchema } }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'The AI service returned an error.');
  if (!json.text) throw new Error('The AI service returned no content.');
  let text = String(json.text).trim();
  if (text.startsWith('```')) text = text.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(text);
}

/** Fetch a set of fields for a country. Returns { path: value } for non-empty values only. */
export async function fetchFields(country: string, fields: AIField[], lang: Lang, apiKey: string, topic: string): Promise<Record<string, any>> {
  const language = lang === 'ar' ? 'Arabic' : 'English';
  const properties: Record<string, any> = {};
  fields.forEach(f => { properties[keyOf(f.path)] = schemaFor(f.type); });
  const list = fields.map(f => `- ${keyOf(f.path)}: ${f.hint}`).join('\n');
  const prompt = `You are a research analyst preparing a bilateral labour-relations brief for the UAE Ministry of Human Resources & Emiratisation (MOHRE).
Topic: ${topic} of ${country}.
Return the latest available OFFICIAL figures (World Bank, ILO, IMF, UNDP, UNESCO, UN Comtrade, national statistics office, US TIP Report). Prefer the most recent year. Never invent a figure: if a value cannot be found, return an empty string (or omit the item).

Rules:
- All text in ${language}, formal government register, concise (a value, not a sentence). Do not add the year or source inside the value.
- Use thousands separators and short units ("56.4 million", "$116.3B", "4.1%"). Money in USD unless stated.

Fields:
${list}`;
  const out = await callAI(prompt, { type: 'OBJECT', properties }, apiKey);
  const result: Record<string, any> = {};
  fields.forEach(f => {
    const v = out?.[keyOf(f.path)];
    const empty = v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
    if (!empty) result[f.path] = v;
  });
  return result;
}

/** Draft the executive summary + key messages strictly from the report's own data. */
export async function draftSummary(data: ReportData, facts: Record<string, any>, lang: Lang, apiKey: string): Promise<{ summary: string; keyMessages: string[] }> {
  const language = lang === 'ar' ? 'Arabic' : 'English';
  const prompt = `Write the executive summary page of a MOHRE (UAE Ministry of Human Resources & Emiratisation) bilateral workforce report on ${data.country}.
Use ONLY the facts below — do not add outside information or invent numbers. Language: ${language}. Formal government register, neutral and factual, no marketing language.

Return:
- summary: ONE short paragraph, 2-3 sentences, 50-80 words: the state of the workforce relationship, worker protection, and the main open item. Wrap the 1-2 most important figures in **double asterisks**. Do not list the discussion points (they are shown separately).
- keyMessages: 3 to 5 action-oriented messages for decision-makers, one sentence each (max 18 words), drawn from the points of discussion and pending items.

Facts (JSON):
${JSON.stringify(facts, null, 1)}`;
  const out = await callAI(prompt, {
    type: 'OBJECT',
    properties: { summary: { type: 'STRING' }, keyMessages: { type: 'ARRAY', items: { type: 'STRING' } } },
  }, apiKey);
  return { summary: String(out.summary || '').trim(), keyMessages: (out.keyMessages || []).map((m: any) => String(m).trim()).filter(Boolean) };
}
