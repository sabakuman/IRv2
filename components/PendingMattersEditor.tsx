import React from 'react';
import { Layers, Plus, X, RefreshCw, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PendingMatter } from '../types';
import { Button } from './ui/LayoutComponents';

interface PendingMattersEditorProps {
  pendingMatters: PendingMatter[];
  onChange: (matters: PendingMatter[]) => void;
  isRTL: boolean;
  onAutoImport?: () => void;
  showAutoImport?: boolean;
}

export const PendingMattersEditor: React.FC<PendingMattersEditorProps> = ({
  pendingMatters,
  onChange,
  isRTL,
  onAutoImport,
  showAutoImport = false,
}) => {
  const currentList = pendingMatters || [];

  const handleAdd = () => {
    const newItem: PendingMatter = {
      id: uuidv4(),
      matter: '',
      dept: isRTL ? 'إدارة العلاقات الدولية' : 'International Relations',
      status: 'pending',
    };
    onChange([...currentList, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = [...currentList];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleUpdate = (index: number, updates: Partial<PendingMatter>) => {
    const updated = [...currentList];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const DEPT_OPTIONS = isRTL
    ? [
        'إدارة العلاقات الدولية',
        'قطاع شؤون العمل والعمليات',
        'إدارة التفتيش والتوجيه العمالي',
        'إدارة علاقات العمل',
        'الهيئة الاتحادية للهوية والجنسية والجمارك وأمن المنافذ (ICP)',
        'صندوق حماية العمالة',
        'إدارة تصاريح العمل',
      ]
    : [
        'International Relations',
        'Labour Affairs & Operations',
        'Labour Inspection & Guidance',
        'Labour Relations Department',
        'Federal Authority for Identity, Citizenship, Customs and Port Security (ICP)',
        'Workers Protection Fund',
        'Work Permits Department',
      ];

  return (
    <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Layers size={16} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {isRTL ? 'المواضيع تحت المراجعة (الملخص التنفيذي - الصفحة 2)' : 'Matters Under Review (Executive Brief - Page 2)'}
            </h5>
            <p className="text-[10.5px] text-gray-500 dark:text-gray-400">
              {isRTL 
                ? 'إضافة وتعديل الملفات والمتابعات الجارية بين القطاعات والجانب المقابل' 
                : 'Manage active follow-ups and inter-departmental pending files for the Executive Brief'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              currentList.length > 6
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {currentList.length} {isRTL ? 'مواضيع' : 'matters'} {currentList.length > 6 && (isRTL ? '(يتجاوز 6 الموصى به)' : '(> 6 recommended max)')}
          </span>

          {showAutoImport && onAutoImport && (
            <button
              type="button"
              onClick={onAutoImport}
              className="text-[10.5px] text-primary dark:text-primary-light hover:underline flex items-center gap-1 font-bold bg-primary/5 dark:bg-primary/20 px-2 py-1 rounded border border-primary/20 transition-colors"
              title={isRTL ? 'استيراد تلقائي من الاتفاقيات والمستجدات المسجلة' : 'Auto-import from existing updates/agreements'}
            >
              <RefreshCw size={11} />
              {isRTL ? 'استيراد تلقائي' : 'Auto-Import'}
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        {isRTL
          ? 'المواضيع المدخلة هنا تظهر مباشرة في قسم "المواضيع تحت المراجعة" بالصفحة الثانية من التقرير (يوصى بحد أقصى 6 بنود لتنسيق الصفحة المثالي).'
          : 'Items entered here display directly in Section 6 (Matters Under Review) on Page 2 (recommended maximum of 6 items for optimal print layout).'}
      </p>

      {currentList.length > 6 && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg flex items-center gap-2 text-[10.5px] text-amber-900 dark:text-amber-300">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span>
            {isRTL
              ? 'ملاحظة: البطاقة في الصفحة 2 مصممة لاستيعاب حتى 6 مواضيع في شبكة ثنائية. المواضيع الإضافية سيتم تضمين أول 6 منها في الصفحة لتفادي تجاوز المساحة.'
              : 'Notice: The Page 2 card is calibrated for up to 6 items in a 2-column grid. The first 6 will be displayed in the brief.'}
          </span>
        </div>
      )}

      <div className="space-y-3 mb-3">
        {currentList.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-3 bg-gray-50/90 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/80 rounded-xl relative group transition-all"
          >
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-2.5 end-2.5 text-gray-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={isRTL ? 'حذف الموضوع' : 'Delete Matter'}
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white font-black text-[10px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                {isRTL ? `الموضوع ${idx + 1}` : `Matter ${idx + 1}`}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                    {isRTL ? 'موضوع أو ملف المتابعة' : 'Matter / Topic Title'}
                  </label>
                  <span className="text-[9px] text-gray-400">
                    {(item.matter || '').length}/140 {isRTL ? 'حرف' : 'chars'}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={140}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={
                    isRTL
                      ? 'مثال: مشروع الربط الإلكتروني لأنظمة استقدام العمالة المساعدة...'
                      : 'e.g. Electronic integration for domestic worker recruitment platforms...'
                  }
                  value={item.matter || ''}
                  onChange={(e) => handleUpdate(idx, { matter: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                    {isRTL ? 'القطاع / الإدارة المعنية' : 'Responsible Department / Sector'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list={`dept-options-${idx}`}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={isRTL ? 'اختر أو اكتب الإدارة...' : 'Select or type department...'}
                      value={item.dept || ''}
                      onChange={(e) => handleUpdate(idx, { dept: e.target.value })}
                    />
                    <datalist id={`dept-options-${idx}`}>
                      {DEPT_OPTIONS.map((deptName, dIdx) => (
                        <option key={dIdx} value={deptName} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                    {isRTL ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={item.status || 'pending'}
                    onChange={(e) => handleUpdate(idx, { status: e.target.value })}
                  >
                    <option value="pending">{isRTL ? 'قيد المتابعة (Pending)' : 'Pending'}</option>
                    <option value="in_coordination">{isRTL ? 'قيد التنسيق (In Coordination)' : 'In Coordination'}</option>
                    <option value="urgent">{isRTL ? 'عاجل (Urgent)' : 'Urgent'}</option>
                    <option value="awaiting_reply">{isRTL ? 'بانتظار الرد (Awaiting Reply)' : 'Awaiting Reply'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        {currentList.length === 0 && (
          <div className="p-5 border-2 border-dashed border-gray-200 dark:border-gray-700/80 rounded-xl text-center">
            <Layers className="mx-auto text-gray-300 dark:text-gray-600 mb-1.5" size={26} />
            <p className="text-xs text-gray-600 dark:text-gray-300 font-bold">
              {isRTL ? 'لا توجد مواضيع تحت المراجعة مضافة حالياً' : 'No matters under review added yet'}
            </p>
            <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-1 max-w-md mx-auto">
              {isRTL
                ? 'انقر على الزر أدناه لإضافة ملف أو موضوع جديد للمتابعة، أو استخدم الاستيراد التلقائي إن كانت هناك اتفاقيات ومستجدات مسجلة.'
                : 'Click below to add a pending matter or file, or use auto-import if agreements or updates already exist.'}
            </p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed flex items-center justify-center gap-1.5 text-primary dark:text-primary-light hover:bg-primary/5 py-2 font-bold text-xs"
        onClick={handleAdd}
      >
        <Plus size={14} />
        {isRTL ? 'إضافة موضوع تحت المراجعة' : 'Add Matter Under Review'}
      </Button>
    </div>
  );
};
