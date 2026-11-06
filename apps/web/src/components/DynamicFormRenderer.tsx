import React from 'react';
import { CategoryTemplate, TemplateField } from '@bulkkx/shared';

interface DynamicFormRendererProps {
  template: CategoryTemplate;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  mode?: 'supplier_listing' | 'buyer_requirement';
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  template,
  values,
  onChange,
  mode = 'supplier_listing',
}) => {
  // If buyer requirement, show matchable & buyerVisible fields
  const fields = [
    ...template.coreFields.filter((f) => (mode === 'buyer_requirement' ? f.buyerVisible : true)),
    ...template.categoryFields.filter((f) => (mode === 'buyer_requirement' ? f.buyerVisible : true)),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const val = values[field.name] !== undefined ? values[field.name] : field.defaultValue || '';

        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>
                {field.label} {field.required && <span className="text-rose-400">*</span>}
              </span>
              {field.unit && <span className="text-[11px] font-mono text-emerald-400">({field.unit})</span>}
            </label>

            {field.type === 'enum' && field.options ? (
              <select
                value={val}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Select {field.label}...</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <div className="relative">
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.unit === '%' ? '0.1' : '1'}
                  value={val}
                  placeholder={`e.g. ${field.min !== undefined ? `${field.min} - ${field.max || 100}` : '10'}`}
                  onChange={(e) => onChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                {field.unit && (
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">
                    {field.unit}
                  </span>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={val}
                placeholder={field.description || `Enter ${field.label}`}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            )}

            {field.description && <span className="text-[11px] text-slate-500">{field.description}</span>}
          </div>
        );
      })}
    </div>
  );
};
