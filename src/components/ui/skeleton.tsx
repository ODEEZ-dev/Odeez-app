import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse animate-pulse-subtle rounded-lg bg-muted/60', className)}
      {...props}
    />
  )
}

export { Skeleton }