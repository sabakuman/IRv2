import React, { useEffect, useState } from 'react';
import { Printer, X, AlertTriangle, Languages } from 'lucide-react';
import { MockService } from '../services/mockService';
import { Report } from '../types';
import { useLanguage } from '../context/LanguageContext';
import ReportDocument from '../components/report/ReportDocument';
import { fromClassic } from '../components/report/classicAdapter';
import { COPY, Lang } from '../components/report/reportCopy';

/* Print page (new design): #/report/:id?lang=en|ar — renders the report and a print toolbar. */
export default function ReportPrint() {
  const parts = window.location.hash.split('?')[0].split('/');
  const id = parts.length >= 3 && (parts[1] === 'report' || parts[1] === 'print') ? parts[2] : undefined;

  const { language, setLanguage } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const q = hash.indexOf('?');
    const lang = new URLSearchParams(q !== -1 ? hash.substring(q) : '').get('lang');
    if ((lang === 'en' || lang === 'ar') && lang !== language) setLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!id) { setError(true); return; }
    MockService.getReportById(id).then(r => (r ? setReport({ ...r, data: fromClassic(r.data) }) : setError(true)));
  }, [id]);

  const lang: Lang = language === 'ar' ? 'ar' : 'en';
  const T = COPY[lang];
  const isRTL = lang === 'ar';

  if (error) {
    return (
      <div className="rpt" dir={isRTL ? 'rtl' : 'ltr'} style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <AlertTriangle size={40} color="#9b3434" />
        <h2 style={{ margin: 0, fontSize: '1.6em' }}>{T.notFound}</h2>
        <p style={{ margin: 0, color: '#6b7684' }}>{T.notFoundMsg}</p>
      </div>
    );
  }
  if (!report) {
    return <div className="rpt" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#24527f' }}>{T.loading}</div>;
  }

  return (
    <div className="rpt rpt-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="rpt-toolbar" style={isRTL ? { left: 20 } : { right: 20 }}>
        <button className="primary" onClick={() => window.print()}><Printer size={16} />{T.print}</button>
        <button className="ghost" onClick={() => setLanguage(isRTL ? 'en' : 'ar')}><Languages size={16} />{T.switchLang}</button>
        <button className="ghost" onClick={() => window.close()} aria-label="Close"><X size={16} /></button>
      </div>
      <ReportDocument report={report} lang={lang} />
    </div>
  );
}
