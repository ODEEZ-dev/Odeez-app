import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Calendar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DayPicker> & {
  className?: string
}) {
  return (
    <DayPicker
      className={cn(
        'rounded-md p-3',
        className
      )}
      showOutsideDays
      fromMonth={new Date()}
      components={{
        IconLeft: (props) => (
          <Button
            variant="ghost"
            size="icon"
            className="p-0 h-7 w-7"
            {...props}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ),
        IconRight: (props) => (
          <Button
            variant="ghost"
            size="icon"
            className="p-0 h-7 w-7"
            {...props}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        ),
      }}
      classNames={{
        root: 'flex flex-col',
        months: 'space-y-4',
        month: 'w-full',
        table: 'w-full',
        head: 'text-center text-sm font-medium text-muted-foreground',
        head_cell: 'text-center text-sm font-medium text-muted-foreground',
        day: 'w-10 h-10 p-0 text-center text-sm',
        nav_button: 'w-10 h-10 p-0 rounded-md text-sm font-medium transition-colors hover:bg-accent focus:bg-accent focus:outline-none',
      }}
      modifiersClassNames={{
        range_start: 'bg-primary text-primary-foreground',
        range_end: 'bg-primary text-primary-foreground',
        range_middle: 'bg-primary/20',
      }}
      {...props}
    />
  )
}

export default Calendar
export { DayPicker } from 'react-day-picker'