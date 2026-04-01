import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Plus } from 'lucide-react';
import AddMemberModal, { type MemberFormData } from '../components/AddMemberModal';
import type { Member, MemberStatus } from '../types/member';

/** Status color mapping matching wireframe exactly */
const statusStyles: Record<MemberStatus, { text: string; bg: string }> = {
  ACTIVE: { text: 'text-success', bg: 'bg-success/5' },
  EXPIRED: { text: 'text-danger', bg: 'bg-danger/5' },
  INACTIVE: { text: 'text-neutral-400', bg: 'bg-neutral-50' },
};

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
];

export default function MembersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddMember = (data: MemberFormData) => {
    // TODO: send to backend
    console.log('New member:', data);
    setIsAddModalOpen(false);
  };

  const filters = ['All', 'Active', 'Expired', 'Inactive'];

  /** Filter members based on search and status filter */
  const filteredMembers = sampleMembers.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' || member.status === activeFilter;
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
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5 bg-surface border border-neutral-300
              rounded-lg text-sm text-secondary placeholder:text-neutral-400
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              transition-all duration-200
            "
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="
              flex items-center gap-2 px-4 py-2.5 bg-surface
              border border-neutral-300 rounded-lg text-sm text-secondary
              hover:border-neutral-400 transition-all duration-200 cursor-pointer
            "
          >
            <span>Filter</span>
            <ChevronDown
              size={14}
              className={`text-neutral-400 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          {filterOpen && (
            <div className="
              absolute right-0 top-full mt-1 w-36 z-20
              bg-surface border border-neutral-200 rounded-lg
              shadow-lg overflow-hidden
            ">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setFilterOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm cursor-pointer
                    transition-colors duration-150
                    ${activeFilter === filter
                      ? 'bg-primary text-text-light font-medium'
                      : 'text-secondary hover:bg-surface-alt'
                    }
                  `}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Members Table ── */}
      <div className="max-w-3xl mx-auto">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-surface">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => {
              const style = statusStyles[member.status];
              const isHovered = hoveredRow === index;

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/dashboard/members/${member.id}`)}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    flex items-center px-4 sm:px-6 py-3 border-b border-neutral-200
                    last:border-b-0 transition-all duration-200 cursor-pointer
                    ${isHovered
                      ? 'bg-warning'
                      : index % 2 === 0
                        ? 'bg-surface'
                        : 'bg-surface-alt/50'
                    }
                  `}
                >
                  {/* ID */}
                  <span className={`
                    text-sm font-medium w-16 flex-shrink-0
                    ${isHovered ? 'text-secondary' : 'text-primary'}
                  `}>
                    #{member.id}
                  </span>

                  {/* Hover indicator (shown in wireframe on hover)
                  {isHovered && (
                    <span className="text-xs text-secondary/60 hidden sm:inline">
                      (on mouse hover)
                    </span>
                  )} */}

                  {/* Name — pushed to the right half */}
                  <span className={`
                    flex-1 text-sm text-right sm:text-center
                    ${isHovered ? 'text-secondary font-medium' : 'text-secondary'}
                  `}>
                    {member.firstName} {member.lastName}
                  </span>

                  {/* Status */}
                  <span className={`
                    text-sm font-medium w-24 text-right flex-shrink-0
                    ${isHovered ? 'text-danger font-semibold' : style.text}
                  `}>
                    {member.status}
                  </span>
                </div>
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
