import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Member, MemberStatus } from '../types/member';

/* ── Sample data (mirrors MembersPage until backend exists) ── */
const sampleMembers: Member[] = [
  {
    id: '67',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456464',
    joinDate: '2023-01-01',
    expiryDate: '2023-03-03',
    status: 'ACTIVE',
    notes: '',
  },
  {
    id: '68',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456465',
    joinDate: '2023-01-01',
    expiryDate: '2023-03-03',
    status: 'ACTIVE',
    notes: '',
  },
  {
    id: '69',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456466',
    joinDate: '2023-02-15',
    expiryDate: '2023-04-15',
    status: 'EXPIRED',
    notes: 'Needs follow-up',
  },
  {
    id: '70',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456467',
    joinDate: '2023-02-15',
    expiryDate: '2023-04-15',
    status: 'EXPIRED',
    notes: '',
  },
  {
    id: '71',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456468',
    joinDate: '2023-03-10',
    expiryDate: '2023-06-10',
    status: 'INACTIVE',
    notes: 'Moved to another city',
  },
  {
    id: '72',
    firstName: 'John Elmo',
    lastName: 'Doe',
    contactNumber: '123445456469',
    joinDate: '2023-03-10',
    expiryDate: '2023-06-10',
    status: 'INACTIVE',
    notes: '',
  },
];

/** Side tab options */
type SideTab = 'payment' | 'attendance';

/** Format ISO date to readable format */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Status text colour */
function statusColor(status: MemberStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-success';
    case 'EXPIRED':
      return 'text-danger';
    case 'INACTIVE':
      return 'text-neutral-400';
  }
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const [activeSideTab, setActiveSideTab] = useState<SideTab>('payment');

  /* ── Look up the member ── */
  const member = sampleMembers.find((m) => m.id === memberId);

  /* ── Local state so we can toggle status ── */
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(
    member?.status ?? 'INACTIVE',
  );

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500 text-lg">Member not found.</p>
        <button
          onClick={() => navigate('/dashboard/members')}
          className="
            flex items-center gap-2 text-primary hover:text-primary-dark
            text-sm font-medium transition-colors cursor-pointer
          "
        >
          <ArrowLeft size={16} />
          Back to Members
        </button>
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;

  /* ── Action handlers ── */
  const handleCheckIn = () => {
    // TODO: call backend check-in endpoint
    console.log('Checked in:', member.id);
  };

  const handleDeactivate = () => {
    setMemberStatus('INACTIVE');
    // TODO: call backend deactivate endpoint
    console.log('Deactivated:', member.id);
  };

  const handleEditProfile = () => {
    // TODO: open edit modal or navigate to edit
    console.log('Edit profile:', member.id);
  };

  /* ── Derived flags ── */
  const canCheckIn = memberStatus === 'ACTIVE';
  const canDeactivate = memberStatus !== 'INACTIVE';

  return (
    <div className="relative min-h-full flex">
      {/* ════════════════════════════════════════════
          Main content area
         ════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col">
        {/* ── Name Banner ── */}
        <div className="flex justify-center mb-8">
          <div
            className="
              px-14 py-3 bg-primary rounded-lg
              shadow-md shadow-primary/25
            "
          >
            <h1 className="text-text-light text-2xl sm:text-3xl font-semibold tracking-wide text-center">
              {fullName}
            </h1>
          </div>
        </div>

        {/* ── Profile & Tabs Container ── */}
        <div className="max-w-3xl w-full mx-auto flex items-start justify-center pr-4 md:pr-12">
          {/* ── Profile Card ── */}
          <div
            className="
              max-w-2xl w-full bg-surface-alt border border-neutral-300
              px-8 py-6 sm:px-10 sm:py-8 z-10
            "
          >
            {/* Info rows */}
            <div className="space-y-4">
              {/* Contact Number */}
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold text-sm sm:text-base">
                  Contact Number
                </span>
                <span className="text-secondary text-sm sm:text-base font-medium">
                  {member.contactNumber}
                </span>
              </div>

              {/* Join Date */}
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold text-sm sm:text-base">
                  Join Date
                </span>
                <span className="text-secondary text-sm sm:text-base font-medium">
                  {formatDate(member.joinDate)}
                </span>
              </div>

              {/* Expiry Date */}
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold text-sm sm:text-base">
                  Expiry Date
                </span>
                <span className="text-secondary text-sm sm:text-base font-medium">
                  {formatDate(member.expiryDate)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold text-sm sm:text-base">
                  Status
                </span>
                <span
                  className={`text-sm sm:text-base font-semibold uppercase ${statusColor(memberStatus)}`}
                >
                  {memberStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <span className="text-primary font-semibold text-sm sm:text-base">
                Notes:
              </span>
              <div
                className="
                  mt-2 w-full min-h-[80px] px-4 py-3
                  bg-white border border-neutral-300 rounded-md
                  text-sm text-secondary
                "
              >
                {member.notes || '\u00A0'}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {/* Edit Profile */}
              <button
                onClick={handleEditProfile}
                className="
                  px-6 py-2 border-2 border-secondary rounded-lg
                  text-sm font-semibold text-secondary bg-transparent
                  hover:bg-secondary hover:text-text-light
                  active:scale-[0.97] transition-all duration-200 cursor-pointer
                "
              >
                Edit Profile
              </button>

              {/* Check-In */}
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className={`
                  px-6 py-2 border-2 rounded-lg text-sm font-semibold
                  active:scale-[0.97] transition-all duration-200
                  ${canCheckIn
                    ? 'border-neutral-400 text-neutral-600 bg-transparent hover:bg-neutral-100 cursor-pointer'
                    : 'border-neutral-200 text-neutral-300 bg-neutral-50 cursor-not-allowed'
                  }
                `}
              >
                Check-In
              </button>

              {/* Deactivate */}
              <button
                onClick={handleDeactivate}
                disabled={!canDeactivate}
                className={`
                  px-6 py-2 border-2 rounded-lg text-sm font-semibold
                  active:scale-[0.97] transition-all duration-200
                  ${canDeactivate
                    ? 'border-danger text-danger bg-transparent hover:bg-danger hover:text-text-light cursor-pointer'
                    : 'border-neutral-200 text-neutral-300 bg-neutral-50 cursor-not-allowed'
                  }
                `}
              >
                Deactivate
              </button>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              Right-side vertical tabs
             ════════════════════════════════════════════ */}
          <div className="hidden md:flex flex-col gap-0 pt-0 -ml-[1px]">
            {/* Payment History tab */}
            <button
              onClick={() => setActiveSideTab('payment')}
              className={`
                [writing-mode:vertical-rl]
                px-2.5 py-4 text-[8px] font-semibold tracking-wider uppercase
                border border-neutral-300 border-l-0 rounded-r-lg cursor-pointer
                transition-all duration-200
                ${activeSideTab === 'payment'
                  ? 'bg-primary text-text-light border-primary z-10'
                  : 'bg-surface text-primary hover:bg-surface-alt'
                }
              `}
            >
              Payment History
            </button>

            {/* Attendance tab */}
            <button
              onClick={() => setActiveSideTab('attendance')}
              className={`
                [writing-mode:vertical-rl]
                px-2.5 py-4 text-[8px] font-semibold tracking-wider uppercase
                border border-neutral-300 border-l-0 border-t-0 rounded-r-lg cursor-pointer
                transition-all duration-200
                ${activeSideTab === 'attendance'
                  ? 'bg-primary text-text-light border-primary z-10'
                  : 'bg-surface text-primary hover:bg-surface-alt'
                }
              `}
            >
              Attendance
            </button>
          </div>
        </div>

        {/* ── Back Button (bottom-left, pill-shaped, matching wireframe) ── */}
        <div className="fixed bottom-6 left-6 sm:bottom-8 sm:left-72 z-20">
          <button
            onClick={() => navigate('/dashboard/members')}
            className="
              flex items-center gap-1.5 px-5 py-2.5 bg-primary text-text-light
              rounded-full shadow-lg shadow-primary/30
              hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40
              active:scale-95 transition-all duration-200 cursor-pointer
              text-sm font-semibold
            "
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
