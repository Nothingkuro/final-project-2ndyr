import { useEffect, useMemo, useRef, useState } from 'react';
import SearchBar from '../common/SearchBar';
import type { PaymentMember } from '../../types/payment';

interface MemberSearchSelectProps {
  members: PaymentMember[];
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function formatMemberName(member: PaymentMember | undefined) {
  if (!member) {
    return '';
  }

  return `${member.firstName} ${member.lastName}`;
}

export default function MemberSearchSelect({
  members,
  selectedMemberId,
  onSelectMember,
  disabled = false,
  placeholder = 'Search member...',
}: MemberSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId),
    [members, selectedMemberId],
  );

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) => {
      const fullName = formatMemberName(member).toLowerCase();

      return fullName.includes(normalizedQuery) || member.contactNumber.includes(normalizedQuery);
    });
  }, [members, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setSearchQuery(formatMemberName(selectedMember));
  }, [selectedMember]);

  return (
    <div ref={containerRef}>
      <label className="mb-1.5 block text-sm font-semibold text-primary">Select Member</label>
      <SearchBar
        value={searchQuery}
        onChange={(value) => {
          setSearchQuery(value);
          const trimmedValue = value.trim();

          if (!trimmedValue) {
            onSelectMember('');
            setShowSuggestions(false);
            return;
          }

          if (selectedMemberId) {
            const selectedName = formatMemberName(selectedMember).toLowerCase();
            if (trimmedValue.toLowerCase() !== selectedName) {
              onSelectMember('');
            }
          }

          setShowSuggestions(true);
        }}
        disabled={disabled || members.length === 0}
        placeholder={placeholder}
        inputClassName="bg-white border-neutral-300 text-secondary placeholder:text-neutral-400"
      />

      {showSuggestions && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-neutral-300 bg-surface">
          {filteredMembers.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-400">No matching members found.</p>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = selectedMemberId === member.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onSelectMember(member.id);
                    setSearchQuery(formatMemberName(member));
                    setShowSuggestions(false);
                  }}
                  className={`
                    flex w-full items-center justify-between border-b border-neutral-200 px-4 py-2.5 text-left text-sm
                    last:border-b-0 transition-colors duration-150 cursor-pointer
                    ${isSelected ? 'bg-warning text-secondary font-semibold' : 'hover:bg-surface-alt/70 text-secondary'}
                  `}
                >
                  <span>{formatMemberName(member)}</span>
                  <span className="text-xs text-neutral-500">{member.contactNumber}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
