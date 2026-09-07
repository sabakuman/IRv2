import React from 'react';
import { ShieldAlert, Plus, X, Sparkles, AlertCircle, Check } from 'lucide-react';
import { Button } from './ui/LayoutComponents';
import { ReportData } from '../types';

interface AttentionNotesEditorProps {
  attentionNotes: string[];
  onChange: (notes: string[]) => void;
  isRTL: boolean;
  reportData?: ReportData;
}

export function generateSuggestedAttentionNotes(data?: ReportData, isRTL: boolean = true): string[] {
  if (!data) return [];
  const suggestions: string[] = [];

  // 1. Counterpart Lead Delegate
  const leadDelegate = data.delegations?.partner?.[0];
  if (leadDelegate) {
    if (!leadDelegate.metBefore || !leadDelegate.meetingYear) {
      const name = leadDelegate.name || (isRTL ? 'رئيس الوفد المقابل' : 'Lead Delegate');
      const title = leadDelegate.title ? ` (${leadDelegate.title})` : '';
      suggestions.push(
        isRTL
          ? `عضو جديد في الوفد المقابل: يشارك ${name}${title} في المباحثات الرسمية للمرة الأولى دون لقاءات سابقة مسجلة.`
          : `First-time counterpart: ${name}${title} joins official bilateral talks for the first time with no prior meetings on record.`
      );
    }
  }

  // 2. Pending official correspondence / letter awaiting reply
  const correspondence = data.lastCorrespondence;
  if (correspondence && (correspondence.status === 'awaiting_reply' || correspondence.status === 'بانتظار الرد')) {
    const subject = correspondence.subject || correspondence.ref || (isRTL ? 'مراسلة رسمية' : 'Official correspondence');
    suggestions.push(
      isRTL
        ? `مراسلة بانتظار الرد: موضوع "${subject}" (${correspondence.ref || ''}) ما زال بانتظار الإفادة والمتابعة من الجانب المقابل.`
        : `Correspondence awaiting reply: "${subject}" (${correspondence.ref || ''}) remains pending response from partner ministry.`
    );
  }

  // 3. Pending Bilateral Agreements / MOUs
  const pendingAgreements = (data.bilateralAgreements || []).filter(a => a.status === 'pending');
  if (pendingAgreements.length > 0) {
    const agr = pendingAgreements[0];
    suggestions.push(
      isRTL
        ? `مشروع اتفاقية قيد المراجعة: "${agr.title}" قيد الاستكمال والمراجعة تمهيداً للتوقيع أو التجديد.`
        : `Pending Agreement: "${agr.title}" is under ministerial review awaiting finalization.`
    );
  }

  // 4. Pending Matters under Review
  const pendingMatters = (data.pendingMatters || []).filter(m => m.status === 'urgent' || m.status === 'pending');
  if (pendingMatters.length > 0 && suggestions.length < 4) {
    const pm = pendingMatters[0];
    suggestions.push(
      isRTL
        ? `موضوع قيد المتابعة (${pm.dept}): "${pm.matter}" يتطلب تسريع وتيرة التنسيق الثنائي لإنجازه.`
        : `Pending track (${pm.dept}): "${pm.matter}" requires bilateral coordination to expedite closure.`
    );
  }

  // 5. Labour complaints under review
  const complaintsCount = parseInt(data.uaeWorkforceStats?.mohre?.laborComplaintsUnderReview || '0', 10);
  if (complaintsCount > 0 && suggestions.length < 4) {
    suggestions.push(
      isRTL
        ? `ملف الشكاوى العمالية: تسجيل ${complaintsCount} شكوى عمالية قيد النظر تتطلب التنسيق لتسريع تسويتها ودياً وقضائياً.`
        : `Labour Complaints: ${complaintsCount} individual complaints remain under review, warranting bilateral coordination.`
    );
  }

  return suggestions.slice(0, 4);
}

export const AttentionNotesEditor: React.FC<AttentionNotesEditorProps> = ({
  attentionNotes,
  onChange,
  isRTL,
  reportData,
}) => {
  // Always clean list of active notes without forcing minimum
  const notes = Array.isArray(attentionNotes) ? [...attentionNotes] : [];
  const activeCount = notes.filter(n => n && n.trim().length > 0).length;

  const handleNoteChange = (index: number, value: string) => {
    const updated = [...notes];
    while (updated.length <= index) {
      updated.push('');
    }
    updated[index] = value;
    onChange(updated);
  };

  const handleRemoveNote = (index: number) => {
    const updated = [...notes];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleAddNote = () => {
    if (notes.length < 4) {
      onChange([...notes, '']);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleAutoSuggest = () => {
    const suggested = generateSuggestedAttentionNotes(reportData, isRTL);
    if (suggested.length > 0) {
      onChange(suggested);
    }
  };

  return (
    <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-amber-200/70 dark:border-amber-800/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
              {isRTL ? 'ملاحظات وتنبيهات تتطلب الانتباه قبل الاجتماع' : 'Critical Pre-Meeting Attention Flags'}
            </h5>
            <p className="text-[10.5px] text-amber-800/70 dark:text-amber-400/80">
              {isRTL
                ? 'اختياري: تظهر في أسفل الملخص التنفيذي إن وُجدت، وفي حال عدم وجودها يُحذف القسم تلقائياً'
                : 'Optional: Appears on Executive Brief if added, otherwise section is completely hidden'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded">
            {activeCount}/4 {isRTL ? 'تنبيهات نشطة' : 'active flags'}
          </span>

          {notes.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-[11px] h-7 px-2 bg-white dark:bg-gray-800 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 flex items-center gap-1 font-bold"
              title={isRTL ? 'حذف كافة التنبيهات وإخفاء القسم من التقرير' : 'Clear all flags and hide section'}
            >
              <X size={12} />
              <span>{isRTL ? 'إفراغ الكل' : 'Clear All'}</span>
            </Button>
          )}

          {reportData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoSuggest}
              className="text-[11px] h-7 px-2.5 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 flex items-center gap-1 font-bold"
              title={isRTL ? 'اقتراح تنبيهات استناداً لبيانات التقرير والمراسلات والاتفاقيات' : 'Suggest flags from report data'}
            >
              <Sparkles size={12} className="text-amber-600" />
              <span>{isRTL ? 'اقتراح ذكي' : 'Auto-Suggest'}</span>
            </Button>
          )}

          {notes.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNote}
              className="text-[11px] h-7 px-2 bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 flex items-center gap-1 font-bold"
            >
              <Plus size={12} />
              <span>{isRTL ? 'إضافة تنبيه' : 'Add Flag'}</span>
            </Button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white/70 dark:bg-gray-900/50 border border-dashed border-amber-300 dark:border-amber-800/80 rounded-lg p-3.5 text-center">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
            {isRTL ? 'لا توجد ملاحظات أو تنبيهات مضافة حالياً' : 'No attention flags currently defined'}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mb-2.5">
            {isRTL
              ? 'في حال عدم إضافة أي تنبيه، لن يظهر هذا القسم إطلاقاً في صفحة الملخص التنفيذي. يمكنك إضافة تنبيه يدوياً أو استخدام الاقتراح الذكي.'
              : 'If left empty, this section is completely removed from the Executive Brief page. You can add flags manually or auto-suggest.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddNote}
              className="text-xs h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>{isRTL ? 'إضافة تنبيه أول' : 'Add First Flag'}</span>
            </Button>
            {reportData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoSuggest}
                className="text-xs h-8 px-3 bg-white dark:bg-gray-800 border-amber-300 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5"
              >
                <Sparkles size={13} className="text-amber-600" />
                <span>{isRTL ? 'توليد تنبيهات ذكية' : 'Generate Smart Flags'}</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notes.map((val, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-white dark:bg-gray-900/90 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-2 transition-all focus-within:ring-2 focus-within:ring-amber-400/30"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-1">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <textarea
                  rows={2}
                  maxLength={160}
                  className="w-full text-xs bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                  placeholder={
                    isRTL
                      ? `التنبيه رقم ${idx + 1} (مثال: مراسلة بانتظار الرد، مستجد اتفاقية، ملاحظة حول الوفد المقابل...)`
                      : `Attention flag #${idx + 1} (e.g. pending reply, agreement update, counterpart note...)`
                  }
                  value={val}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                />
                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                    {val.trim().length > 0 ? (
                      <span className="flex items-center gap-1">
                        <Check size={11} className="text-emerald-500" />
                        {isRTL ? 'جاهز للعرض في الملخص' : 'Active in Brief'}
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">{isRTL ? 'فارغ (يرجى كتابة نص أو حذفه)' : 'Empty (type text or delete)'}</span>
                    )}
                  </span>
                  <span>{val.length}/160</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveNote(idx)}
                className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                title={isRTL ? 'حذف هذا التنبيه' : 'Remove flag'}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-800/80 dark:text-amber-400/80">
        <p className="flex items-center gap-1">
          <AlertCircle size={12} className="shrink-0 text-amber-600" />
          <span>
            {isRTL
              ? 'ملاحظة: إذا لم تُضف أي تنبيهات، سيتم استبعاد هذا القسم كلياً ولن يُعرض في الملخص التنفيذي.'
              : 'Note: If no flags are provided, this section is completely excluded from the Executive Brief.'}
          </span>
        </p>
      </div>
    </div>
  );
};
