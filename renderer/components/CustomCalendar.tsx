import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function CustomCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Use window width to determine how many months to show
  const [numberOfMonths, setNumberOfMonths] = React.useState(1);
  
  React.useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setNumberOfMonths(window.innerWidth >= 768 ? 2 : 1);
      };
      
      // Set initial value
      handleResize();
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={numberOfMonths}
      className={cn("p-1 scale-100 origin-top transform w-full", className)}
      classNames={{
        months: "flex flex-row space-x-8 justify-center w-full",
        month: "space-y-2 w-full max-w-[280px] backdrop-blur-sm bg-gray-900/30 p-3 rounded-lg border border-gray-800/50",
        caption: "flex justify-center relative items-center px-2 py-2 mb-2",
        caption_label: "text-sm font-medium text-burgundy-300",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity border-gray-700",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse border-spacing-0",
        head_row: "flex justify-between w-full mb-1",
        head_cell:
          "text-burgundy-500 font-medium w-9 font-normal text-[10px] py-1 tracking-wider uppercase",
        row: "flex w-full mt-1 justify-between",
        cell: "relative p-0 text-center text-sm rdp-cell",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal text-[13px] aria-selected:opacity-100 transition-all hover:bg-gray-800",
        ),
        day_selected:
          "bg-gradient-to-br from-burgundy-600 to-burgundy-700 text-white hover:from-burgundy-500 hover:to-burgundy-600 hover:text-white focus:bg-burgundy-600 focus:text-white ring-2 ring-burgundy-500/30 rdp-day_selected",
        day_today: "bg-burgundy-900/50 text-burgundy-100 font-bold border border-burgundy-500/40",
        day_outside:
          "text-gray-500 opacity-50",
        day_disabled: "text-gray-600 opacity-30",
        day_range_middle:
          "aria-selected:bg-burgundy-900/20 aria-selected:text-burgundy-200",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

CustomCalendar.displayName = "CustomCalendar";
