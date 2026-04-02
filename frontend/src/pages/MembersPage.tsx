import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AddMemberModal, { type MemberFormData } from '../components/AddMemberModal';
import SearchBar from '../components/common/SearchBar';
import FilterDropdown from '../components/common/FilterDropdown';
import MemberTableRow from '../components/members/MemberTableRow';
import type { Member, MemberStatus } from '../types/member';

type MembersFilter = 'ALL' | MemberStatus;

const filterOptions: Array<{ label: string; value: MembersFilter }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

/** Sample member data matching the wireframe */
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

interface MembersPageProps {
  members?: Member[];
  initialSearchQuery?: string;
  initialFilter?: MembersFilter;
  initialFilterOpen?: boolean;
  initialAddModalOpen?: boolean;
  disableNavigation?: boolean;
}

export default function MembersPage({
  members = sampleMembers,
  initialSearchQuery = '',
  initialFilter = 'ALL',
  initialFilterOpen = false,
  initialAddModalOpen = false,
  disableNavigation = false,
}: MembersPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterOpen, setFilterOpen] = useState(initialFilterOpen);
  const [activeFilter, setActiveFilter] = useState<MembersFilter>(initialFilter);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAddModalOpen);

  const handleAddMember = (data: MemberFormData) => {
    // TODO: send to backend
    console.log('New member:', data);
    setIsAddModalOpen(false);
  };

  /** Filter members based on search and status filter */
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'ALL' || member.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
          onChange={setSearchQuery}
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
            setFilterOpen(false);
          }}
        />
      </div>

      {/* ── Members Table ── */}
      <div className="max-w-3xl mx-auto">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => {
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
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMember}
      />
    </div>
  );
}
