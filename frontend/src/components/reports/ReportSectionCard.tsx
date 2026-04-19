import type { ReactNode } from 'react';

/**
 * Defines report section card props used by feature UI behavior.
 */
interface ReportSectionCardProps {
  /**
   * Data used for title behavior.
   */
  title: string;
  /**
   * Data used for subtitle behavior.
   */
  subtitle: string;
  /**
   * Data used for icon behavior.
   */
  icon: ReactNode;
  /**
   * Data used for icon class name behavior.
   */
  iconClassName?: string;
  /**
   * Data used for content max height class name behavior.
   */
  contentMaxHeightClassName?: string;
  /**
   * Nested content rendered inside the component wrapper.
   */
  children: ReactNode;
  /**
   * Data used for action slot behavior.
   */
  actionSlot?: ReactNode;
}

/**
 * Renders the report section card interface for feature UI behavior.
 *
 * @param params Input used by report section card.
 * @returns Rendered JSX output.
 */
export default function ReportSectionCard({
  title,
  subtitle,
  icon,
  iconClassName = 'bg-primary/20 text-primary-light',
  contentMaxHeightClassName = 'max-h-[8rem] sm:max-h-[12rem]',
  children,
  actionSlot,
}: ReportSectionCardProps) {
  return (
    <article className="flex h-full min-h-0 flex-col rounded-xl border border-neutral-700 bg-secondary-light p-4 sm:p-5 shadow-card text-text-light">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight text-text-light">{title}</h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-400">{subtitle}</p>
          </div>
        </div>

        {actionSlot ? <div className="w-full sm:w-auto">{actionSlot}</div> : null}
      </header>

      <div
        className={`min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#BE0000_#1A1A1A] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-secondary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/80 [&::-webkit-scrollbar-thumb:hover]:bg-primary-light ${contentMaxHeightClassName}`}
      >
        {children}
      </div>
    </article>
  );
}
