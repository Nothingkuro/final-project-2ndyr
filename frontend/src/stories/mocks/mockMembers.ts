import type { Member } from '../../types/member';
import type { PaymentMember } from '../../types/payment';

export const storyMembers: Member[] = [
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

export const storyPaymentMembers: PaymentMember[] = [
  {
    id: '67',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    contactNumber: '09171234567',
    status: 'ACTIVE',
  },
  {
    id: '68',
    firstName: 'Lea',
    lastName: 'Santos',
    contactNumber: '09179998888',
    status: 'EXPIRED',
  },
  {
    id: '69',
    firstName: 'Paolo',
    lastName: 'Rivera',
    contactNumber: '09176667777',
    status: 'INACTIVE',
  },
];
