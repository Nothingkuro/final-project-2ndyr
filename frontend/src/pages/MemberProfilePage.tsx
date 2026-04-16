import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MemberFormModal, { type MemberFormData } from '../components/members/AddMemberModal';
import ActionGroup from '../components/common/ActionGroup';
import ProfileInfoRow from '../components/members/ProfileInfoRow';
import StatusBadge from '../components/members/StatusBadge';
import MemberAttendanceHistoryPanel from '../components/members/attendance/MemberAttendanceHistoryPanel';
import MemberPaymentHistoryPanel from '../components/members/payment-history/MemberPaymentHistoryPanel';
import { getAuthHeaders } from '../services/authHeaders';
import { API_BASE_URL } from '../services/apiBaseUrl';
import type { Member, MemberStatus } from '../types/member';
import type { Attendance } from '../types/attendance';

type ApiMember = {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  joinDate: string;
  expiryDate: string;
  status: MemberStatus;
  notes?: string;
};

type ApiMembersResponse = {
  items: ApiMember[];
};

type ApiAttendance = {
  id: string;
  memberId: string;
  checkInTime: string;
};

type ApiAttendancesResponse = {
  items: ApiAttendance[];
};

function normalizeMember(apiMember: ApiMember): Member {
  return {
    id: apiMember.id,
    firstName: apiMember.firstName,
    lastName: apiMember.lastName,
    contactNumber: apiMember.contactNumber,
    joinDate: apiMember.joinDate,
    expiryDate: apiMember.expiryDate || '',
    status: apiMember.status,
    notes: apiMember.notes ?? '',
  };
}

function normalizeAttendanceRecord(apiAttendance: ApiAttendance): Attendance {
  return {
    id: apiAttendance.id,
    memberId: apiAttendance.memberId,
    checkInTime: apiAttendance.checkInTime,
  };
}

async function parseApiResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const textBody = await response.text();

  if (textBody.includes('Cannot PATCH /api/members/')) {
    throw new Error('Member update endpoint is unavailable on the running backend. Restart the backend server to load the latest routes.');
  }

  throw new Error(
    textBody.trim().startsWith('<')
      ? 'Server returned HTML instead of JSON. Check VITE_API_BASE_URL and backend API route configuration.'
      : 'Server returned an unexpected response format.',
  );
}

function normalizeNameInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeContactInput(value: string): string {
  return value.replace(/\D/g, '');
}

function createMockAttendanceRecords(memberRecordId: string): Attendance[] {
  const now = Date.now();

  return [
    {
      id: `mock-attendance-${memberRecordId}-1`,
      checkInTime: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      memberId: memberRecordId,
    },
    {
      id: `mock-attendance-${memberRecordId}-2`,
      checkInTime: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      memberId: memberRecordId,
    },
  ];
}

/** Side tab options */
type SideTab = 'payment' | 'attendance';

/** Format ISO date to readable format */
function formatDate(iso: string): string {
  if (!iso) {
    return '--';
  }

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return '--';
  }

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
  members,
  initialSideTab,
  initialStatus,
  disableNavigation = false,
}: MemberProfilePageProps) {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const [activeSideTab, setActiveSideTab] = useState<SideTab | null>(initialSideTab ?? null);

  const [fetchedMember, setFetchedMember] = useState<Member | null>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(!members);
  const [memberLoadError, setMemberLoadError] = useState<string | null>(null);
  const [editableMember, setEditableMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [checkInMessageTone, setCheckInMessageTone] = useState<'success' | 'error' | null>(null);
  const isLocalMode = Boolean(members);

  useEffect(() => {
    setActiveSideTab(initialSideTab ?? null);
  }, [memberId, initialSideTab]);

  useEffect(() => {
    if (members) {
      setFetchedMember(null);
      setIsLoadingMember(false);
      setMemberLoadError(null);
      return;
    }

    if (!memberId) {
      setFetchedMember(null);
      setIsLoadingMember(false);
      setMemberLoadError('Member not found.');
      return;
    }

    const controller = new AbortController();

    const loadMember = async () => {
      try {
        setIsLoadingMember(true);
        setMemberLoadError(null);

        const params = new URLSearchParams({
          search: memberId,
          page: '1',
          pageSize: '100',
        });

        const response = await fetch(`${API_BASE_URL}/api/members?${params.toString()}`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
          },
          credentials: 'include',
          signal: controller.signal,
        });

        const data = (await parseApiResponse(response)) as ApiMembersResponse | { error?: string };

        if (!response.ok) {
          const message = 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Failed to load member profile';
          throw new Error(message);
        }

        const matchingMember = (data as ApiMembersResponse).items.find((item) => item.id === memberId);
        setFetchedMember(matchingMember ? normalizeMember(matchingMember) : null);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load member profile';
        setMemberLoadError(message);
      } finally {
        setIsLoadingMember(false);
      }
    };

    void loadMember();

    return () => {
      controller.abort();
    };
  }, [members, memberId]);

  const sourceMember = members?.find((m) => m.id === memberId) ?? fetchedMember;

  useEffect(() => {
    setEditableMember(sourceMember ? { ...sourceMember } : null);
  }, [sourceMember]);

  const member = editableMember ?? sourceMember;

  useEffect(() => {
    if (!member?.id) {
      setAttendanceHistory([]);
      setCheckInMessage(null);
      setCheckInMessageTone(null);
      return;
    }

    if (isLocalMode) {
      setAttendanceHistory(createMockAttendanceRecords(member.id));
      setCheckInMessage(null);
      setCheckInMessageTone(null);
      return;
    }

    const controller = new AbortController();

    const loadAttendanceHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/members/${member.id}/attendance`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
          },
          credentials: 'include',
          signal: controller.signal,
        });

        const responseBody = (await parseApiResponse(response)) as ApiAttendancesResponse | { error?: string };

        if (!response.ok) {
          const message = 'error' in responseBody && typeof responseBody.error === 'string'
            ? responseBody.error
            : 'Failed to load attendance history';
          throw new Error(message);
        }

        const records = Array.isArray((responseBody as ApiAttendancesResponse).items)
          ? (responseBody as ApiAttendancesResponse).items.map(normalizeAttendanceRecord)
          : [];

        setAttendanceHistory(records);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }

        console.error('Failed to load attendance history:', error);
        setAttendanceHistory([]);
      }
    };

    void loadAttendanceHistory();

    return () => {
      controller.abort();
    };
  }, [isLocalMode, member?.id]);

  useEffect(() => {
    if (!checkInMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCheckInMessage(null);
      setCheckInMessageTone(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [checkInMessage]);

  /* ── Local state so we can toggle status ── */
  const [memberStatus, setMemberStatus] = useState<MemberStatus>(
    initialStatus ?? 'INACTIVE',
  );

  useEffect(() => {
    setMemberStatus(initialStatus ?? member?.status ?? 'INACTIVE');
  }, [initialStatus, member?.status]);

  if (isLoadingMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500 text-lg">Loading member profile...</p>
      </div>
    );
  }

  if (memberLoadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 text-lg">{memberLoadError}</p>
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
  const handleCheckIn = async () => {
    if (!canCheckIn || isCheckingIn) {
      return;
    }

    if (isLocalMode) {
      const mockAttendance: Attendance = {
        id: `mock-attendance-${member.id}-${Date.now()}`,
        checkInTime: new Date().toISOString(),
        memberId: member.id,
      };

      setAttendanceHistory((currentRecords) => [mockAttendance, ...currentRecords]);
      setCheckInMessage('Mock check-in recorded locally.');
      setCheckInMessageTone('success');
      setActiveSideTab('attendance');
      return;
    }

    try {
      setIsCheckingIn(true);
      setCheckInMessage(null);
      setCheckInMessageTone(null);

      const response = await fetch(`${API_BASE_URL}/api/members/${member.id}/check-in`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });

      const responseBody = (await parseApiResponse(response)) as ApiAttendance | { error?: string };

      if (!response.ok) {
        const message = 'error' in responseBody && typeof responseBody.error === 'string'
          ? responseBody.error
          : 'Failed to check in member';
        throw new Error(message);
      }

      const createdAttendance = normalizeAttendanceRecord(responseBody as ApiAttendance);
      setAttendanceHistory((currentRecords) => [createdAttendance, ...currentRecords]);
      setCheckInMessage('Check-in recorded successfully.');
      setCheckInMessageTone('success');
      setActiveSideTab('attendance');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to check in member';
      setCheckInMessage(message);
      setCheckInMessageTone('error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleDeactivate = async () => {
    if (!member || isDeactivating || memberStatus === 'INACTIVE') {
      return;
    }

    setDeactivateError(null);

    if (members) {
      setMemberStatus('INACTIVE');
      setEditableMember((currentMember) => {
        if (!currentMember) {
          return currentMember;
        }

        return {
          ...currentMember,
          status: 'INACTIVE',
          expiryDate: '',
        };
      });
      return;
    }

    try {
      setIsDeactivating(true);

      const response = await fetch(`${API_BASE_URL}/api/members/${member.id}/deactivate`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });

      const responseBody = (await parseApiResponse(response)) as ApiMember | { error?: string };

      if (!response.ok) {
        const message = 'error' in responseBody && typeof responseBody.error === 'string'
          ? responseBody.error
          : 'Failed to deactivate member';
        throw new Error(message);
      }

      const updatedMember = normalizeMember(responseBody as ApiMember);
      updatedMember.notes = member.notes;
      setEditableMember(updatedMember);
      setMemberStatus(updatedMember.status);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate member';
      setDeactivateError(message);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleEditProfile = () => {
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleProfileSave = async (data: MemberFormData) => {
    if (!member) return;

    const normalizedFirstName = normalizeNameInput(data.firstName);
    const normalizedLastName = normalizeNameInput(data.lastName);
    const normalizedContactNumber = normalizeContactInput(data.contactNumber);
    const normalizedNotes = data.notes.trim();
    const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

    if (!fullName || !normalizedContactNumber) {
      setEditError('Full name and contact number are required.');
      return;
    }

    if (normalizedContactNumber.length < 7 || normalizedContactNumber.length > 15) {
      setEditError('Contact number must contain 7 to 15 digits.');
      return;
    }

    setIsSavingProfile(true);

    try {
      setEditError(null);

      if (members) {
        const duplicateContact = members.some(
          (existingMember) =>
            existingMember.id !== member.id
            && normalizeContactInput(existingMember.contactNumber) === normalizedContactNumber,
        );

        if (duplicateContact) {
          setEditError('Contact number already exists.');
          return;
        }

        setEditableMember((currentMember) => {
          if (!currentMember) {
            return currentMember;
          }

          return {
            ...currentMember,
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            contactNumber: normalizedContactNumber,
            notes: normalizedNotes,
          };
        });

        setIsEditModalOpen(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/members/${member.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          contactNumber: normalizedContactNumber,
          notes: normalizedNotes,
        }),
      });

      const responseBody = (await parseApiResponse(response)) as ApiMember | { error?: string };

      if (!response.ok) {
        const message = 'error' in responseBody && typeof responseBody.error === 'string'
          ? responseBody.error
          : 'Failed to update member profile';
        throw new Error(message);
      }

      const updatedMember = normalizeMember(responseBody as ApiMember);
      updatedMember.notes = normalizedNotes;
      setEditableMember(updatedMember);
      setIsEditModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update member profile';
      setEditError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* ── Derived flags ── */
  const canCheckIn = memberStatus === 'ACTIVE';
  const canDeactivate = memberStatus !== 'INACTIVE' && !isDeactivating;
  const handleSideTabToggle = (tab: SideTab) => {
    setActiveSideTab((currentTab) => (currentTab === tab ? null : tab));
  };

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
          {activeSideTab === 'payment' ? (
            <MemberPaymentHistoryPanel memberId={member.id} />
          ) : activeSideTab === 'attendance' ? (
            <MemberAttendanceHistoryPanel
              memberId={member.id}
              attendances={attendanceHistory}
            />
          ) : (
            /* ── Profile Card ── */
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
                    label: isCheckingIn ? 'Checking In...' : 'Check-In',
                    onClick: handleCheckIn,
                    disabled: !canCheckIn || isCheckingIn,
                    variant: 'neutral',
                  },
                  {
                    label: isDeactivating ? 'Deactivating...' : 'Deactivate',
                    onClick: handleDeactivate,
                    disabled: !canDeactivate,
                    variant: 'danger',
                  },
                ]}
              />

              {deactivateError && (
                <p className="mt-3 text-center text-sm text-red-600">{deactivateError}</p>
              )}

              {checkInMessage && (
                <p className={`mt-3 text-center text-sm ${checkInMessageTone === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                  {checkInMessage}
                </p>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════
              Right-side vertical tabs
             ════════════════════════════════════════════ */}
          <div className="hidden md:flex flex-col gap-0 pt-0 -ml-px">
            {/* Payment History tab */}
            <button
              onClick={() => handleSideTabToggle('payment')}
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
              onClick={() => handleSideTabToggle('attendance')}
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

      <MemberFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSavingProfile) {
            setEditError(null);
            setIsEditModalOpen(false);
          }
        }}
        onSubmit={handleProfileSave}
        initialData={{
          firstName: member.firstName,
          lastName: member.lastName,
          contactNumber: member.contactNumber,
          notes: member.notes,
        }}
        isSubmitting={isSavingProfile}
        errorMessage={editError}
        title="Edit Profile"
        submitLabel="Save Changes"
        submittingLabel="Saving..."
      />
    </div>
  );
}
