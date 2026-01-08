/**
 * EmptyStateCard - Empty state component for ThermalReceiptDesignerV2
 * Shown when no template is loaded
 * Features:
 * - Primary CTA: "Create Blank Template"
 * - Secondary action: "Load from Library"
 * - Clean, centered design with visual hierarchy
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { EmptyStateCardProps } from 'utils/receiptDesignerTypes';

export function EmptyStateCard({ onCreateBlank, onLoadFromLibrary }: EmptyStateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center justify-center min-h-[500px] p-8"
    >
      <Card
        className="max-w-lg w-full text-center"
        style={{
          backgroundColor: QSAITheme.background.panel,
          border: `1px solid ${QSAITheme.border.light}`,
          ...styles.frostedGlassStyle
        }}
      >
        <CardHeader className="pb-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className="p-4 rounded-full"
              style={{
                backgroundColor: `${QSAITheme.purple.primary}20`,
                border: `2px solid ${QSAITheme.purple.primary}40`
              }}
            >
              <FileText
                className="h-12 w-12"
                style={{ color: QSAITheme.purple.primary }}
              />
            </div>
          </div>

          <CardTitle
            className="text-2xl font-bold mb-2"
            style={{ color: QSAITheme.text.primary }}
          >
            No Template Loaded
          </CardTitle>
          
          <p
            className="text-sm"
            style={{ color: QSAITheme.text.muted }}
          >
            Get started by creating a new receipt template or loading an existing one from your library.
          </p>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {/* Primary Action: Create Blank */}
          <Button
            onClick={onCreateBlank}
            className="w-full py-6 text-base font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: QSAITheme.purple.primary,
              color: QSAITheme.text.primary,
              border: 'none'
            }}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Create Blank Template
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: QSAITheme.border.light }}
            />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: QSAITheme.text.muted }}
            >
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: QSAITheme.border.light }}
            />
          </div>

          {/* Secondary Action: Load from Library */}
          <Button
            onClick={onLoadFromLibrary}
            variant="outline"
            className="w-full py-6 text-base transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <FolderOpen className="h-5 w-5 mr-2" />
            Load from Library
          </Button>

          {/* Helper Text */}
          <p
            className="text-xs pt-4"
            style={{ color: QSAITheme.text.muted }}
          >
            💡 Tip: Start with a blank template to design from scratch, or browse your library for saved designs.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
