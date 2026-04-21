import { MemberStatus, Prisma } from '@prisma/client';
import { IFactory } from './factory.interface';

export type MemberFactoryInput = {
  fullName: string;
  contactNumber: string;
  notes: string;
};

/**
 * Factory Method for creating Member create payloads.
 */
export class MemberFactory
  implements IFactory<MemberFactoryInput, Prisma.MemberCreateInput>
{
  create(input: MemberFactoryInput): Prisma.MemberCreateInput {
    const [firstName, ...lastNameParts] = input.fullName.split(' ');

    return {
      firstName,
      lastName: lastNameParts.join(' '),
      contactNumber: input.contactNumber,
      notes: input.notes,
      status: MemberStatus.ACTIVE,
    };
  }
}
