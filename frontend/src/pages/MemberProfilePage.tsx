import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ActionGroup from '../components/common/ActionGroup';
import ProfileInfoRow from '../components/members/ProfileInfoRow';
import StatusBadge from '../components/members/StatusBadge';
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
  {
    id: 'skdfkjsbdfkjbdfksbdfkjbsdkjfbskjdbfkjsbdkjsbdfksbfksdbfkbsjdfkjbdf',
    firstName: 'slkdkfnfklsndflnsdklfnskldfnklsdnfklsndklfnskldnklsdnflksndfnsdnlsndfnln',
    lastName: 'sdnfnrensnglndslgjosjfgsjgo',
    contactNumber: '94035809485093',
    joinDate: '2023-03-10',
    expiryDate: '2023-06-10',
    status: 'INACTIVE',
    notes: 'test member with very long id and name to check text overflow handling in the UI',
  }
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

interface MemberProfilePageProps {
  members?: Member[];
  initialSideTab?: SideTab;
  initialStatus?: MemberStatus;
  disableNavigation?: boolean;
}

export default function MemberProfilePage({
  members = sampleMembers,
  initialSideTab = 'payment',
  initialStatus,
  disableNavigation = false,
}: MemberProfilePageProps) {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const [activeSideTab, setActiveSideTab] = useState<SideTab>(initialSideTab);

  /* ── Look up the member ── */
  const member = members.find((m) => m.id === memberId);

  /* ── Local state so we can toggle status ── */
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(
    initialStatus ?? member?.status ?? 'INACTIVE',
  );

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500 text-lg">Member not found.</p>
        <button
          onClick={() => {
            if (!disableNavigation) {
              navigate('/dashboard/members');
            }
          }}
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
              <ProfileInfoRow label="Contact Number" value={member.contactNumber} />
              <ProfileInfoRow label="Join Date" value={formatDate(member.joinDate)} />
              <ProfileInfoRow label="Expiry Date" value={formatDate(member.expiryDate)} />
              <ProfileInfoRow
                label="Status"
                value={
                  <StatusBadge
                    status={memberStatus}
                    className="text-sm sm:text-base"
                  />
                }
              />
            </div>

            {/* Notes */}
            <div className="mt-6">
              <span className="text-primary font-semibold text-sm sm:text-base">
                Notes:
              </span>
              <div
                className="
                  mt-2 w-full min-h-20 px-4 py-3
                  bg-white border border-neutral-300 rounded-md
                  text-sm text-secondary
                "
              >
                {member.notes || '\u00A0'}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <ActionGroup
              className="mt-8"
              actions={[
                {
                  label: 'Edit Profile',
                  onClick: handleEditProfile,
                  variant: 'secondary',
                },
                {
                  label: 'Check-In',
                  onClick: handleCheckIn,
                  disabled: !canCheckIn,
                  variant: 'neutral',
                },
                {
                  label: 'Deactivate',
                  onClick: handleDeactivate,
                  disabled: !canDeactivate,
                  variant: 'danger',
                },
              ]}
            />
          </div>

          {/* ════════════════════════════════════════════
              Right-side vertical tabs
             ════════════════════════════════════════════ */}
          <div className="hidden md:flex flex-col gap-0 pt-0 -ml-px">
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
            onClick={() => {
              if (!disableNavigation) {
                navigate('/dashboard/members');
              }
            }}
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
