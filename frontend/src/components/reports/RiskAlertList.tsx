import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AtRiskMember, AtRiskSeverity } from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

interface RiskAlertListProps {
  members: AtRiskMember[];
  updatedAt?: string;
  isLoading?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return 'No recent check-in';
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return 'No recent check-in';
  }

  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function resolveSeverity(member: AtRiskMember): AtRiskSeverity {
  return member.daysUntilExpiry <= 3 ? 'CRITICAL' : 'HIGH';
}

function severityClassName(severity: AtRiskSeverity): string {
  return severity === 'CRITICAL'
    ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-orange-600 bg-orange-50 border-orange-200';
}

export default function RiskAlertList({
  members,
  updatedAt,
  isLoading = false,
}: RiskAlertListProps) {
  const navigate = useNavigate();

  return (
    <ReportSectionCard
      title="At-Risk Member Predictions"
      subtitle="Churn risk signals"
      icon={<AlertTriangle size={20} />}
      iconClassName="bg-warning/20 text-warning"
      contentMaxHeightClassName="max-h-[20rem]"
      actionSlot={
        updatedAt
          ? (
              <p className="text-xs text-neutral-400">
                Updated: {formatDate(updatedAt)}
              </p>
            )
          : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="animate-pulse rounded-lg border border-neutral-700 bg-secondary p-3">
              <div className="h-4 w-40 rounded bg-neutral-600" />
              <div className="mt-2 h-3 w-28 rounded bg-neutral-700" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-600 bg-secondary px-4 py-6 text-center text-sm text-neutral-300">
          No at-risk members found for the current prediction window.
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const severity = resolveSeverity(member);

            return (
              <li key={member.id} className="rounded-lg border border-neutral-700 bg-secondary p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-light">{member.name}</p>
                    <p className="text-xs text-neutral-300">Last Check-in: {formatDate(member.lastCheckInTime)}</p>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${severityClassName(severity)}`}>
                    {severity}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-neutral-300">
                    Expires in <span className="font-semibold text-text-light">{member.daysUntilExpiry} day(s)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/members/${member.id}`)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-text-light transition-colors hover:bg-primary-dark"
                  >
                    View Profile
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ReportSectionCard>
  );
}
