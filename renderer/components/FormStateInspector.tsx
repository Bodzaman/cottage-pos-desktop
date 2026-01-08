import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Code, Eye, EyeOff } from 'lucide-react';
import { MenuItemFormData } from '../utils/masterTypes';
import type { ItemVariant } from '../utils/menuTypes';

/**
 * FormStateInspector - Development Tool for Form Debugging
 * 
 * Only rendered in development mode to help developers inspect:
 * - Current form state
 * - Validation errors
 * - Dirty fields
 * - Form values in real-time
 * - Variant data
 * 
 * @example
 * ```tsx
 * import { mode, Mode } from 'app';
 * 
 * {mode === Mode.DEV && (
 *   <FormStateInspector
 *     watch={watch}
 *     errors={errors}
 *     isDirty={isDirty}
 *     dirtyFields={dirtyFields}
 *     variants={variants}
 *   />
 * )}
 * ```
 */

interface FormStateInspectorProps {
  watch: UseFormWatch<MenuItemFormData>;
  errors: any;
  isDirty: boolean;
  dirtyFields: any;
  variants: ItemVariant[];
  isSubmitting?: boolean;
  touchedFields?: any;
}

export const FormStateInspector: React.FC<FormStateInspectorProps> = ({
  watch,
  errors,
  isDirty,
  dirtyFields,
  variants,
  isSubmitting = false,
  touchedFields = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'values' | 'errors' | 'state' | 'variants'>('values');
  const [showRawJson, setShowRawJson] = useState(false);

  // Get all current form values
  const formValues = watch();

  // Count error fields
  const errorCount = Object.keys(errors).length;
  const dirtyFieldCount = Object.keys(dirtyFields).length;

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
          aria-label="Open form state inspector"
        >
          <Code className="h-4 w-4 mr-2" />
          Dev Inspector
          {errorCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {errorCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] flex flex-col">
      <Card className="bg-gray-900 border-purple-500/50 shadow-2xl flex flex-col max-h-full">
        {/* Header */}
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-purple-400 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Form State Inspector
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawJson(!showRawJson)}
                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
              >
                {showRawJson ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-7 px-2 text-gray-400 hover:text-white"
                aria-label="Minimize inspector"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={`px-2 py-1 rounded ${isDirty ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
              {isDirty ? '● Dirty' : '○ Clean'}
            </span>
            <span className={`px-2 py-1 rounded ${isSubmitting ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {isSubmitting ? '⟳ Submitting' : '✓ Ready'}
            </span>
            {errorCount > 0 && (
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">
                {errorCount} Error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-4 border-b border-gray-700 flex-shrink-0">
          {(['values', 'errors', 'state', 'variants'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'errors' && errorCount > 0 && (
                <span className="ml-1 text-red-400">({errorCount})</span>
              )}
              {tab === 'variants' && variants.length > 0 && (
                <span className="ml-1 text-purple-400">({variants.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <CardContent className="pt-4 overflow-auto flex-1 min-h-0">
          {/* Values Tab */}
          {activeTab === 'values' && (
            <div className="space-y-2">
              {showRawJson ? (
                <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto max-h-96">
                  {JSON.stringify(formValues, null, 2)}
                </pre>
              ) : (
                <div className="space-y-3">
                  {Object.entries(formValues).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-700 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono text-purple-400">{key}:</span>
                        <span className="text-xs text-gray-300 text-right flex-1 break-all">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                      {dirtyFields[key] && (
                        <span className="text-xs text-orange-400">● Modified</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div className="space-y-2">
              {errorCount === 0 ? (
                <p className="text-sm text-green-400">✓ No validation errors</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(errors).map(([field, error]: [string, any]) => (
                    <div key={field} className="bg-red-500/10 border border-red-500/30 rounded p-3">
                      <div className="text-xs font-mono text-red-400 mb-1">{field}</div>
                      <div className="text-xs text-gray-300">
                        {error?.message || 'Validation failed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* State Tab */}
          {activeTab === 'state' && (
            <div className="space-y-3 text-xs">
              <div className="bg-gray-800 rounded p-3">
                <div className="font-semibold text-purple-400 mb-2">Form State</div>
                <div className="space-y-1 text-gray-300">
                  <div>isDirty: <span className={isDirty ? 'text-orange-400' : 'text-green-400'}>{String(isDirty)}</span></div>
                  <div>isSubmitting: <span className={isSubmitting ? 'text-blue-400' : 'text-gray-400'}>{String(isSubmitting)}</span></div>
                  <div>Dirty Fields: <span className="text-orange-400">{dirtyFieldCount}</span></div>
                  <div>Touched Fields: <span className="text-blue-400">{Object.keys(touchedFields).length}</span></div>
                </div>
              </div>

              <div className="bg-gray-800 rounded p-3">
                <div className="font-semibold text-purple-400 mb-2">Field Status</div>
                <div className="space-y-1">
                  {Object.keys(dirtyFields).map((field) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="text-orange-400">●</span>
                      <span className="font-mono text-gray-300">{field}</span>
                    </div>
                  ))}
                  {dirtyFieldCount === 0 && (
                    <span className="text-gray-400">No dirty fields</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-2">
              {variants.length === 0 ? (
                <p className="text-sm text-gray-400">No variants added</p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="bg-gray-800 border border-gray-700 rounded p-3">
                      <div className="text-xs font-semibold text-purple-400 mb-2">
                        Variant #{index + 1}
                      </div>
                      <div className="space-y-1 text-xs text-gray-300">
                        <div>Name: <span className="text-white">{variant.name}</span></div>
                        {variant.protein_type && (
                          <div>Protein: <span className="text-white">{variant.protein_type}</span></div>
                        )}
                        <div>Prices:</div>
                        <div className="pl-3 space-y-0.5">
                          {variant.price_dine_in && <div>Dine-in: £{variant.price_dine_in.toFixed(2)}</div>}
                          {variant.price_takeaway && <div>Takeaway: £{variant.price_takeaway.toFixed(2)}</div>}
                          {variant.price_delivery && <div>Delivery: £{variant.price_delivery.toFixed(2)}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400 flex-shrink-0">
          💡 Dev mode only - not visible in production
        </div>
      </Card>
    </div>
  );
};
