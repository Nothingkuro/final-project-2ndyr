import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import MemberFormModal, { type MemberFormData } from '../components/AddMemberModal';
import SearchBar from '../components/common/SearchBar';
import FilterDropdown from '../components/common/FilterDropdown';
import MemberTableRow from '../components/members/MemberTableRow';
import { getAuthHeaders } from '../services/authHeaders';
import { API_BASE_URL } from '../services/apiBaseUrl';
import type { Member, MemberStatus } from '../types/member';

type MembersFilter = 'ALL' | MemberStatus;

const filterOptions: Array<{ label: string; value: MembersFilter }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 150;

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
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

interface MembersPageProps {
  members?: Member[];
  initialSearchQuery?: string;
  initialFilter?: MembersFilter;
  initialFilterOpen?: boolean;
  initialAddModalOpen?: boolean;
  disableNavigation?: boolean;
}

export default function MembersPage({
  members,
  initialSearchQuery = '',
  initialFilter = 'ALL',
  initialFilterOpen = false,
  initialAddModalOpen = false,
  disableNavigation = false,
}: MembersPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearchQuery);
  const [filterOpen, setFilterOpen] = useState(initialFilterOpen);
  const [activeFilter, setActiveFilter] = useState<MembersFilter>(initialFilter);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAddModalOpen);
  const [membersList, setMembersList] = useState<Member[]>(members ?? []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(members?.length ?? 0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState(members === undefined);
  const [membersLoadError, setMembersLoadError] = useState<string | null>(null);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const responseCacheRef = useRef<Map<string, ApiMembersResponse>>(new Map());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (members) {
      const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();
      const filtered = members.filter((member) => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        const matchesSearch =
          !normalizedQuery ||
          fullName.includes(normalizedQuery) ||
          member.id.toLowerCase().includes(normalizedQuery) ||
          member.contactNumber.toLowerCase().includes(normalizedQuery);

        const matchesFilter =
          activeFilter === 'ALL' || member.status === activeFilter;

        return matchesSearch && matchesFilter;
      });

      const computedTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      const safePage = Math.min(currentPage, computedTotalPages);
      const start = (safePage - 1) * PAGE_SIZE;

      setMembersList(filtered.slice(start, start + PAGE_SIZE));
      setTotalMembers(filtered.length);
      setTotalPages(computedTotalPages);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
      }
      setIsLoadingMembers(false);
      setMembersLoadError(null);
      return;
    }

    const controller = new AbortController();

    const loadMembers = async () => {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(PAGE_SIZE),
        });

        const trimmedSearch = debouncedSearchQuery.trim();
        if (trimmedSearch) {
          params.set('search', trimmedSearch);
        }

        if (activeFilter !== 'ALL') {
          params.set('status', activeFilter);
        }

        const cacheKey = params.toString();
        const cachedResponse = responseCacheRef.current.get(cacheKey);

        if (cachedResponse) {
          setMembersList(cachedResponse.items.map(normalizeMember));
          setTotalMembers(cachedResponse.total);
          setTotalPages(Math.max(1, cachedResponse.totalPages));
          setMembersLoadError(null);
          setIsLoadingMembers(false);
          return;
        }

        setIsLoadingMembers(true);
        setMembersLoadError(null);

        const response = await fetch(`${API_BASE_URL}/api/members?${params.toString()}`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
          },
          credentials: 'include',
          signal: controller.signal,
        });

        const data = (await response.json()) as ApiMembersResponse | { error?: string };

        if (!response.ok) {
          const message = 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Failed to load members';
          throw new Error(message);
        }

        const paginatedData = data as ApiMembersResponse;
  responseCacheRef.current.set(cacheKey, paginatedData);
        setMembersList(paginatedData.items.map(normalizeMember));
        setTotalMembers(paginatedData.total);
        setTotalPages(Math.max(1, paginatedData.totalPages));
      } catch (error: unknown) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load members';
        setMembersLoadError(message);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    void loadMembers();

    return () => {
      controller.abort();
    };
  }, [members, debouncedSearchQuery, activeFilter, currentPage, refreshNonce]);

  const handleAddMember = async (data: MemberFormData) => {
    if (isSubmittingMember) return;

    setIsSubmittingMember(true);
    setAddMemberError(null);

    try {
      const payload: { fullName: string; contactNumber: string } = {
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        contactNumber: data.contactNumber,
      };

      const response = await fetch(`${API_BASE_URL}/api/members`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const responseBody = (await response.json()) as ApiMember | { error?: string };

      if (!response.ok) {
        const message = 'error' in responseBody && typeof responseBody.error === 'string'
          ? responseBody.error
          : 'Failed to create member';
        throw new Error(message);
      }

      const createdMember = normalizeMember(responseBody as ApiMember);
      createdMember.notes = data.notes;

      if (members) {
        setMembersList((prevMembers) => [createdMember, ...prevMembers]);
      } else {
        responseCacheRef.current.clear();
        setCurrentPage(1);
        setRefreshNonce((prev) => prev + 1);
      }
      setIsAddModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create member';
      setAddMemberError(message);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  return (
    <div className="relative min-h-full">
      {/* ── Page Title with Logo ── */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <h1 className="text-primary text-3xl sm:text-4xl font-semibold">
          Members
        </h1>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          placeholder="Search member..."
          className="flex-1"
          inputClassName="bg-surface border-neutral-300 text-secondary placeholder:text-neutral-400"
        />

        <FilterDropdown
          label="Filter"
          options={filterOptions}
          activeOption={activeFilter}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen((prev) => !prev)}
          onSelect={(option) => {
            setActiveFilter(option as MembersFilter);
            setCurrentPage(1);
            setFilterOpen(false);
          }}
        />
      </div>

      {/* ── Members Table ── */}
      <div className="max-w-3xl mx-auto">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
          {isLoadingMembers ? (
            <div className="px-6 py-12 text-center text-neutral-400 text-sm">
              Loading members...
            </div>
          ) : membersLoadError ? (
            <div className="px-6 py-12 text-center text-red-600 text-sm">
              {membersLoadError}
            </div>
          ) : membersList.length > 0 ? (
            membersList.map((member, index) => {
              const isHovered = hoveredRow === index;

              return (
                <MemberTableRow
                  key={member.id}
                  member={member}
                  index={index}
                  isHovered={isHovered}
                  onClick={() => {
                    if (!disableNavigation) {
                      navigate(`/dashboard/members/${member.id}`);
                    }
                  }}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                />
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-neutral-400 text-sm">
              No members found matching your search.
            </div>
          )}
        </div>

        {!isLoadingMembers && !membersLoadError && (
          <div className="mt-4 flex items-center justify-between text-sm text-secondary">
            <span>
              Showing page {currentPage} of {totalPages} ({totalMembers} member{totalMembers === 1 ? '' : 's'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-md border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Member FAB ── */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-20">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="
            flex items-center gap-2 px-5 py-3 bg-primary text-text-light
            rounded-full shadow-lg shadow-primary/30
            hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40
            active:scale-95 transition-all duration-200 cursor-pointer
            text-sm font-semibold
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Member</span>
        </button>
      </div>

      {/* ── Add Member Modal ── */}
      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMember}
        isSubmitting={isSubmittingMember}
        errorMessage={addMemberError}
      />
    </div>
  );
}
