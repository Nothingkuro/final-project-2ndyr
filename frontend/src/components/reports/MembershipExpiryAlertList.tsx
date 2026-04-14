import { AlertTriangle } from 'lucide-react';
import type { MembershipExpiryAlert } from '../../types/report';
import ReportSectionCard from './ReportSectionCard';

interface MembershipExpiryAlertListProps {
  alerts: MembershipExpiryAlert[];
}

function toDateOnly(value: string): Date {
  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function formatExpiryDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getExpiringMembers(alerts: MembershipExpiryAlert[]): MembershipExpiryAlert[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 3);

  return alerts
    .filter((alert) => {
      const expiry = toDateOnly(alert.expiryDate);
      return expiry >= today && expiry <= maxDate;
    })
    .sort((a, b) => toDateOnly(a.expiryDate).getTime() - toDateOnly(b.expiryDate).getTime());
}

export default function MembershipExpiryAlertList({ alerts }: MembershipExpiryAlertListProps) {
  const expiringMembers = getExpiringMembers(alerts);

  return (
    <ReportSectionCard
      title="Membership Expiry Alerts"
      subtitle="Subscriptions expiring within 3 days"
      icon={<AlertTriangle size={20} />}
      iconClassName="bg-warning/20 text-warning"
    >
      {expiringMembers.length === 0 ? (
        <p className="rounded-lg border border-neutral-700 bg-secondary px-4 py-3 text-sm text-neutral-300">
          No memberships expiring within the next 3 days.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-120 border-collapse">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Contact Number</th>
                </tr>
              </thead>
              <tbody>
                {expiringMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`border-b border-neutral-800 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-secondary-light' : 'bg-secondary'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-text-light">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-warning">{formatExpiryDate(member.expiryDate)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-200">{member.contactNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {expiringMembers.map((member) => (
              <li key={member.id} className="rounded-lg border border-neutral-700 bg-secondary p-3">
                <p className="text-sm font-semibold text-text-light">{member.name}</p>
                <p className="mt-1 text-xs text-warning">Expires: {formatExpiryDate(member.expiryDate)}</p>
                <p className="mt-1 text-xs text-neutral-300">Contact: {member.contactNumber}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </ReportSectionCard>
  );
}
