import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  showDragHandle?: boolean;
}

/**
 * A simplified sortable item component for drag and drop functionality
 * Focuses only on basic drag functionality with minimal overhead
 */
export function SortableItem({ id, children, className = "", showDragHandle = true }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 999 : "auto",
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? "ring-2 ring-[#7C5DFA] shadow-lg scale-105 bg-opacity-90" : ""} transition-all duration-200`}
    >
      <div className="flex items-center">
        {/* Drag handle */}
        {showDragHandle && (
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-10 h-10 cursor-grab active:cursor-grabbing hover:text-[#7C5DFA]"
            style={{ touchAction: "none" }}
          >
            <GripVertical className="h-5 w-5 text-gray-400 transition-colors hover:text-[#7C5DFA]" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
