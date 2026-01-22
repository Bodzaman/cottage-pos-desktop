import { FIXED_SECTIONS, type SectionId } from 'utils/sectionMapping';
import { cn } from '@/lib/utils';

interface POSFixedSectionNavProps {
  selectedSection: SectionId | null;
  onSectionSelect: (sectionId: SectionId) => void;
  className?: string;
}

/**
 * Fixed 7-section navigation for POS Zone 2
 * Displays hardcoded sections in specified order
 */
export function POSFixedSectionNav({
  selectedSection,
  onSectionSelect,
  className
}: POSFixedSectionNavProps) {
  return (
    <div className={cn("flex flex-col gap-1 p-2", className)}>
      {FIXED_SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionSelect(section.id)}
          className={cn(
            "w-full px-4 py-3 rounded-lg text-left transition-all",
            "flex items-center gap-3",
            "hover:bg-accent/50",
            selectedSection === section.id
              ? "bg-primary text-primary-foreground font-semibold shadow-md"
              : "bg-card text-card-foreground"
          )}
        >
          <span className="text-xl">{section.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{section.displayName}</div>
            <div className="text-xs opacity-70">{section.codePrefix}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
