import { MemberStatus, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

type MemberListItem = {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  joinDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  notes: string;
};

type AttendanceListItem = {
  id: string;
  memberId: string;
  checkInTime: string;
};

function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeNamePart(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeContactNumber(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeNotes(value: string): string {
  return value.trim();
}

function toMemberListItem(member: {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  notes: string;
  joinDate: Date;
  expiryDate: Date | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}): MemberListItem {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    contactNumber: member.contactNumber,
    joinDate: member.joinDate.toISOString(),
    expiryDate: member.expiryDate ? member.expiryDate.toISOString() : '',
    status: member.status,
    notes: member.notes,
  };
}

function toAttendanceListItem(attendance: {
  id: string;
  memberId: string;
  checkInTime: Date;
}): AttendanceListItem {
  return {
    id: attendance.id,
    memberId: attendance.memberId,
    checkInTime: attendance.checkInTime.toISOString(),
  };
}

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    await prisma.member.updateMany({
      where: {
        status: MemberStatus.ACTIVE,
        expiryDate: {
          lte: todayEnd,
        },
      },
      data: {
        status: MemberStatus.EXPIRED,
      },
    });

    const searchRaw = typeof req.query.search === 'string' ? req.query.search : '';
    const statusRaw = typeof req.query.status === 'string' ? req.query.status : 'ALL';
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : 1;
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : 20;

    const search = searchRaw.trim();
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.min(Math.floor(pageSizeRaw), 100)
      : 20;

    const status =
      statusRaw === MemberStatus.ACTIVE ||
        statusRaw === MemberStatus.INACTIVE ||
        statusRaw === MemberStatus.EXPIRED
        ? statusRaw
        : null;

    const where: Prisma.MemberWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { contactNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
    };

    const [total, members] = await prisma.$transaction([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          contactNumber: true,
          notes: true,
          joinDate: true,
          expiryDate: true,
          status: true,
        },
      }),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    res.status(200).json({
      items: members.map(toMemberListItem),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const createMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawFullName = req.body?.fullName;
    const rawContactNumber = req.body?.contactNumber;
    const rawNotes = req.body?.notes;

    if (typeof rawFullName !== 'string' || typeof rawContactNumber !== 'string') {
      res.status(400).json({ error: 'Full name and contact number are required' });
      return;
    }

    if (rawNotes !== undefined && typeof rawNotes !== 'string') {
      res.status(400).json({ error: 'Notes must be a string' });
      return;
    }

    const fullName = normalizeFullName(rawFullName);
    const contactNumber = normalizeContactNumber(rawContactNumber);
    const notes = typeof rawNotes === 'string' ? normalizeNotes(rawNotes) : '';

    if (!fullName || !contactNumber) {
      res.status(400).json({ error: 'Full name and contact number are required' });
      return;
    }

    const existingMember = await prisma.member.findUnique({
      where: { contactNumber },
      select: { id: true },
    });

    if (existingMember) {
      res.status(409).json({ error: 'Contact number already exists' });
      return;
    }

    const [firstName, ...lastNameParts] = fullName.split(' ');

    const createdMember = await prisma.member.create({
      data: {
        firstName,
        lastName: lastNameParts.join(' '),
        contactNumber,
        notes,
        // joinDate is set to current timestamp by default in schema.
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        notes: true,
        joinDate: true,
        expiryDate: true,
        status: true,
      },
    });

    res.status(201).json(toMemberListItem(createdMember));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Contact number already exists' });
      return;
    }

    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const memberIdParam = req.params.memberId;
    const memberId = Array.isArray(memberIdParam) ? memberIdParam[0] : memberIdParam;
    const rawFirstName = req.body?.firstName;
    const rawLastName = req.body?.lastName;
    const rawContactNumber = req.body?.contactNumber;
    const rawNotes = req.body?.notes;

    if (!memberId) {
      res.status(400).json({ error: 'Member id is required' });
      return;
    }

    if (
      typeof rawFirstName !== 'string'
      || typeof rawLastName !== 'string'
      || typeof rawContactNumber !== 'string'
    ) {
      res.status(400).json({ error: 'First name, last name, and contact number are required' });
      return;
    }

    if (rawNotes !== undefined && typeof rawNotes !== 'string') {
      res.status(400).json({ error: 'Notes must be a string' });
      return;
    }

    const firstName = normalizeNamePart(rawFirstName);
    const lastName = normalizeNamePart(rawLastName);
    const contactNumber = normalizeContactNumber(rawContactNumber);
    const notes = typeof rawNotes === 'string' ? normalizeNotes(rawNotes) : undefined;
    const fullName = normalizeFullName(`${firstName} ${lastName}`);

    if (!fullName || !contactNumber) {
      res.status(400).json({ error: 'Full name and contact number are required' });
      return;
    }

    if (contactNumber.length < 7 || contactNumber.length > 15) {
      res.status(400).json({ error: 'Contact number must contain 7 to 15 digits' });
      return;
    }

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!existingMember) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName,
        contactNumber,
        ...(notes !== undefined ? { notes } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        notes: true,
        joinDate: true,
        expiryDate: true,
        status: true,
      },
    });

    res.status(200).json(toMemberListItem(updatedMember));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Contact number already exists' });
      return;
    }

    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
};

export const deactivateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const memberIdParam = req.params.memberId;
    const memberId = Array.isArray(memberIdParam) ? memberIdParam[0] : memberIdParam;

    if (!memberId) {
      res.status(400).json({ error: 'Member id is required' });
      return;
    }

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!existingMember) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        status: MemberStatus.INACTIVE,
        expiryDate: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        contactNumber: true,
        notes: true,
        joinDate: true,
        expiryDate: true,
        status: true,
      },
    });

    res.status(200).json(toMemberListItem(updatedMember));
  } catch (error) {
    console.error('Error deactivating member:', error);
    res.status(500).json({ error: 'Failed to deactivate member' });
  }
};

export const getMemberAttendances = async (req: Request, res: Response): Promise<void> => {
  try {
    const memberIdParam = req.params.memberId;
    const memberId = Array.isArray(memberIdParam) ? memberIdParam[0] : memberIdParam;

    if (!memberId) {
      res.status(400).json({ error: 'Member id is required' });
      return;
    }

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!existingMember) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const attendances = await prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkInTime: 'desc' },
      select: {
        id: true,
        memberId: true,
        checkInTime: true,
      },
    });

    res.status(200).json({ items: attendances.map(toAttendanceListItem) });
  } catch (error) {
    console.error('Error fetching member attendances:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

export const checkInMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const memberIdParam = req.params.memberId;
    const memberId = Array.isArray(memberIdParam) ? memberIdParam[0] : memberIdParam;

    if (!memberId) {
      res.status(400).json({ error: 'Member id is required' });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (member.status !== MemberStatus.ACTIVE) {
      res.status(400).json({ error: 'Only active members can check in' });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        memberId,
      },
      select: {
        id: true,
        memberId: true,
        checkInTime: true,
      },
    });

    res.status(201).json(toAttendanceListItem(attendance));
  } catch (error) {
    console.error('Error checking in member:', error);
    res.status(500).json({ error: 'Failed to check in member' });
  }
};
