import { cn } from '@/utils';

interface BlockusLogoProps {
  className?: string;
}

// The blockus brand mark — a solid quarter-circle. Uses currentColor so it
// adapts to the surrounding text color.
export function BlockusLogo({ className }: BlockusLogoProps) {
  return (
    <svg
      viewBox="0 0 1500 1500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      role="img"
      aria-label="blockus"
    >
      <path
        d="M 0 1500 C 0 1104.957031 160.003906 718.675781 439.339844 439.339844 C 718.675781 160.003906 1104.957031 0 1500 0 L 1500 1500 Z"
        fill="currentColor"
      />
    </svg>
  );
}
