import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { PremiumCard } from 'components/PremiumCard';

interface SettingsModuleProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsModule({
  title,
  icon: Icon,
  description,
  children,
  className = '',
}: SettingsModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PremiumCard subsurface padding="md" className={className}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[#8B1538]/15 shrink-0">
            <Icon className="h-4 w-4 text-[#8B1538]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pl-0 md:pl-11">
          {children}
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default SettingsModule;
