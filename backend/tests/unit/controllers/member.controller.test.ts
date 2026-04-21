import { MemberStatus, Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    member: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import {
  checkInMember,
  createMember,
  deactivateMember,
  getMemberAttendances,
  getMembers,
  updateMember,
  undoCheckIn,
} from '../../../src/controllers/member.controller';
import prisma from '../../../src/lib/prisma';
import { globalNotificationSubject } from '../../../src/patterns/observer-pattern/notification.subject';
import { bootstrapObserverPattern } from '../../../src/patterns/observer-pattern/observer.bootstrap';

describe('member controller', () => {
  const mockedPrisma = prisma as any;

  function createResponse(): Response {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
  }

  beforeEach(() => {
    bootstrapObserverPattern();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(globalNotificationSubject, 'notifyAll').mockResolvedValue(undefined);

    // Default $transaction mock to handle both array and callback styles
    mockedPrisma.$transaction.mockImplementation(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(mockedPrisma);
      }
      return Array.isArray(arg) ? Promise.all(arg) : arg;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns paginated members with defaults in getMembers', async () => {
    const joinDate = new Date('2026-01-01T00:00:00.000Z');
    const expiryDate = new Date('2026-02-01T00:00:00.000Z');

    mockedPrisma.member.count.mockResolvedValue(1);
    mockedPrisma.member.findMany.mockResolvedValue([
      {
        id: 'm-1',
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '09171234567',
        notes: 'Evening sessions only',
        joinDate,
        expiryDate,
        status: 'ACTIVE',
      },
    ]);

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getMembers(req, res);

    expect(mockedPrisma.member.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: MemberStatus.ACTIVE,
        }),
        data: { status: MemberStatus.EXPIRED },
      })
    );
    expect(mockedPrisma.member.count).toHaveBeenCalledWith({ where: {} });
    expect(mockedPrisma.member.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
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

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      items: [
        {
          id: 'm-1',
          firstName: 'John',
          lastName: 'Doe',
          contactNumber: '09171234567',
          joinDate: joinDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          status: 'ACTIVE',
          notes: 'Evening sessions only',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it('applies search, status, and pagination rules in getMembers', async () => {
    mockedPrisma.member.count.mockResolvedValue(0);
    mockedPrisma.member.findMany.mockResolvedValue([]);

    const req = {
      query: {
        search: ' 0917 ',
        status: MemberStatus.ACTIVE,
        page: '2',
        pageSize: '200',
      },
    } as unknown as Request;
    const res = createResponse();

    await getMembers(req, res);

    expect(mockedPrisma.member.updateMany).toHaveBeenCalled();
    expect(mockedPrisma.member.count).toHaveBeenCalledWith({
      where: {
        status: MemberStatus.ACTIVE,
        OR: [
          { id: { contains: '0917', mode: 'insensitive' } },
          { firstName: { contains: '0917', mode: 'insensitive' } },
          { lastName: { contains: '0917', mode: 'insensitive' } },
          { contactNumber: { contains: '0917', mode: 'insensitive' } },
        ],
      },
    });
    expect(mockedPrisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
        take: 100,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 100,
        totalPages: 1,
      })
    );
  });

  it('returns 500 in getMembers when transaction fails', async () => {
    mockedPrisma.$transaction.mockRejectedValue(new Error('database failure'));

    const req = { query: {} } as unknown as Request;
    const res = createResponse();

    await getMembers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch members' });
  });

  it('returns 400 in createMember when required fields are missing', async () => {
    const req = { body: { fullName: 'John Doe' } } as Request;
    const res = createResponse();

    await createMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Full name and contact number are required' });
  });

  it('returns 400 in createMember when normalized values are empty', async () => {
    const req = {
      body: {
        fullName: '   ',
        contactNumber: 'abc',
      },
    } as Request;
    const res = createResponse();

    await createMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Full name and contact number are required' });
  });

  it('returns 409 in createMember when contact number already exists', async () => {
    const req = {
      body: {
        fullName: 'Jane Doe',
        contactNumber: '09171234567',
      },
    } as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue({ id: 'existing-member' });

    await createMember(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contact number already exists' });
  });

  it('creates a member with normalized values in createMember', async () => {
    const req = {
      body: {
        fullName: '  John   Doe  ',
        contactNumber: '(0917) 123-4567',
      },
    } as Request;
    const res = createResponse();
    const joinDate = new Date('2026-03-01T00:00:00.000Z');

    mockedPrisma.member.findUnique.mockResolvedValue(null);
    mockedPrisma.member.create.mockResolvedValue({
      id: 'member-1',
      firstName: 'John',
      lastName: 'Doe',
      contactNumber: '09171234567',
      notes: '',
      joinDate,
      expiryDate: null,
      status: 'ACTIVE',
    });

    await createMember(req, res);

    expect(mockedPrisma.member.create).toHaveBeenCalledWith({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '09171234567',
        notes: '',
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

    expect(res.status).toHaveBeenCalledWith(201);
    expect(globalNotificationSubject.notifyAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 'member-1',
      firstName: 'John',
      lastName: 'Doe',
      contactNumber: '09171234567',
      joinDate: joinDate.toISOString(),
      expiryDate: '',
      status: 'ACTIVE',
      notes: '',
    });
  });

  it('returns 409 in createMember on Prisma unique constraint error', async () => {
    const req = {
      body: {
        fullName: 'Jane Doe',
        contactNumber: '09175555555',
      },
    } as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue(null);
    mockedPrisma.member.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate contact', {
        code: 'P2002',
        clientVersion: 'unit-test',
      })
    );

    await createMember(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contact number already exists' });
  });

  it('returns 400 in updateMember when member id is missing', async () => {
    const req = {
      params: {},
      body: {
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '09171234567',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member id is required' });
  });

  it('returns 400 in updateMember when required body fields are missing', async () => {
    const req = {
      params: { memberId: 'member-1' },
      body: {
        firstName: 'John',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'First name, last name, and contact number are required',
    });
  });

  it('returns 400 in updateMember when contact number is out of valid range', async () => {
    const req = {
      params: { memberId: 'member-1' },
      body: {
        firstName: 'John',
        lastName: 'Doe',
        contactNumber: '123-45',
      },
    } as unknown as Request;
    const res = createResponse();

    await updateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contact number must contain 7 to 15 digits' });
  });

  it('returns 404 in updateMember when target member is not found', async () => {
    const req = {
      params: { memberId: 'missing-member' },
      body: {
        firstName: 'Jane',
        lastName: 'Doe',
        contactNumber: '09171234567',
      },
    } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue(null);

    await updateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member not found' });
  });

  it('updates member with normalized values in updateMember', async () => {
    const req = {
      params: { memberId: 'member-2' },
      body: {
        firstName: '  Jane  ',
        lastName: '  Smith  ',
        contactNumber: '+63 917-888-9999',
      },
    } as unknown as Request;
    const res = createResponse();
    const joinDate = new Date('2026-01-15T00:00:00.000Z');

    mockedPrisma.member.findUnique.mockResolvedValue({ id: 'member-2' });
    mockedPrisma.member.update.mockResolvedValue({
      id: 'member-2',
      firstName: 'Jane',
      lastName: 'Smith',
      contactNumber: '639178889999',
      notes: '',
      joinDate,
      expiryDate: null,
      status: 'ACTIVE',
    });

    await updateMember(req, res);

    expect(mockedPrisma.member.update).toHaveBeenCalledWith({
      where: { id: 'member-2' },
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        contactNumber: '639178889999',
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

    expect(res.status).toHaveBeenCalledWith(200);
    expect(globalNotificationSubject.notifyAll).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      id: 'member-2',
      firstName: 'Jane',
      lastName: 'Smith',
      contactNumber: '639178889999',
      joinDate: joinDate.toISOString(),
      expiryDate: '',
      status: 'ACTIVE',
      notes: '',
    });
  });

  it('returns 409 in updateMember on Prisma unique constraint error', async () => {
    const req = {
      params: { memberId: 'member-3' },
      body: {
        firstName: 'Jane',
        lastName: 'Doe',
        contactNumber: '09170001111',
      },
    } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue({ id: 'member-3' });
    mockedPrisma.member.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate contact', {
        code: 'P2002',
        clientVersion: 'unit-test',
      })
    );

    await updateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Contact number already exists' });
  });

  it('returns 400 in deactivateMember when member id is missing', async () => {
    const req = { params: {} } as unknown as Request;
    const res = createResponse();

    await deactivateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member id is required' });
  });

  it('returns 404 in deactivateMember when member is not found', async () => {
    const req = { params: { memberId: 'missing-member' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue(null);

    await deactivateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member not found' });
  });

  it('deactivates member and clears expiry in deactivateMember', async () => {
    const req = { params: { memberId: 'member-4' } } as unknown as Request;
    const res = createResponse();
    const joinDate = new Date('2026-01-20T00:00:00.000Z');

    mockedPrisma.member.findUnique.mockResolvedValue({ id: 'member-4' });
    mockedPrisma.member.update.mockResolvedValue({
      id: 'member-4',
      firstName: 'Carl',
      lastName: 'Morris',
      contactNumber: '09179998888',
      notes: '',
      joinDate,
      expiryDate: null,
      status: 'INACTIVE',
    });

    await deactivateMember(req, res);

    expect(mockedPrisma.member.update).toHaveBeenCalledWith({
      where: { id: 'member-4' },
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

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 'member-4',
      firstName: 'Carl',
      lastName: 'Morris',
      contactNumber: '09179998888',
      joinDate: joinDate.toISOString(),
      expiryDate: '',
      status: 'INACTIVE',
      notes: '',
    });
  });

  it('returns 500 in deactivateMember on unexpected errors', async () => {
    const req = { params: { memberId: 'member-5' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockRejectedValue(new Error('database is down'));

    await deactivateMember(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to deactivate member' });
  });

  it('returns 400 in getMemberAttendances when member id is missing', async () => {
    const req = { params: {} } as unknown as Request;
    const res = createResponse();

    await getMemberAttendances(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member id is required' });
  });

  it('returns 404 in getMemberAttendances when member is not found', async () => {
    const req = { params: { memberId: 'missing-member' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue(null);

    await getMemberAttendances(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member not found' });
  });

  it('returns attendance history in getMemberAttendances', async () => {
    const req = { params: { memberId: 'member-1' } } as unknown as Request;
    const res = createResponse();
    const checkInTime = new Date('2026-04-16T08:00:00.000Z');

    mockedPrisma.member.findUnique.mockResolvedValue({ id: 'member-1' });
    mockedPrisma.attendance.findMany.mockResolvedValue([
      {
        id: 'attendance-1',
        memberId: 'member-1',
        checkInTime,
      },
    ]);

    await getMemberAttendances(req, res);

    expect(mockedPrisma.attendance.findMany).toHaveBeenCalledWith({
      where: { memberId: 'member-1' },
      orderBy: { checkInTime: 'desc' },
      select: {
        id: true,
        memberId: true,
        checkInTime: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      items: [
        {
          id: 'attendance-1',
          memberId: 'member-1',
          checkInTime: checkInTime.toISOString(),
        },
      ],
    });
  });

  it('returns 500 in getMemberAttendances on unexpected errors', async () => {
    const req = { params: { memberId: 'member-1' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockRejectedValue(new Error('database is down'));

    await getMemberAttendances(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch attendance records' });
  });

  it('returns 400 in checkInMember when member id is missing', async () => {
    const req = { params: {} } as unknown as Request;
    const res = createResponse();

    await checkInMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member id is required' });
  });

  it('returns 404 in checkInMember when member is not found', async () => {
    const req = { params: { memberId: 'missing-member' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue(null);

    await checkInMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Member not found' });
  });

  it('returns 400 in checkInMember when member is not active', async () => {
    const req = { params: { memberId: 'member-2' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockResolvedValue({
      id: 'member-2',
      status: MemberStatus.INACTIVE,
    });

    await checkInMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only active members can check in' });
  });

  it('creates attendance in checkInMember for active member', async () => {
    const req = { params: { memberId: 'member-3' } } as unknown as Request;
    const res = createResponse();
    const checkInTime = new Date('2026-04-16T09:30:00.000Z');

    mockedPrisma.member.findUnique.mockResolvedValue({
      id: 'member-3',
      status: MemberStatus.ACTIVE,
    });
    mockedPrisma.attendance.create.mockResolvedValue({
      id: 'attendance-2',
      memberId: 'member-3',
      checkInTime,
    });

    await checkInMember(req, res);

    expect(mockedPrisma.attendance.create).toHaveBeenCalledWith({
      data: {
        memberId: 'member-3',
      },
      select: {
        id: true,
        memberId: true,
        checkInTime: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 'attendance-2',
      memberId: 'member-3',
      checkInTime: checkInTime.toISOString(),
    });
  });

  it('returns 500 in checkInMember on unexpected errors', async () => {
    const req = { params: { memberId: 'member-4' } } as unknown as Request;
    const res = createResponse();

    mockedPrisma.member.findUnique.mockRejectedValue(new Error('database is down'));

    await checkInMember(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to check in member' });
  });

  describe('undoCheckIn', () => {
    it('returns 400 when attendance id is missing', async () => {
      const req = { params: {} } as unknown as Request;
      const res = createResponse();

      await undoCheckIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Attendance id is required' });
    });

    it('returns 404 when attendance record is not found', async () => {
      const req = { params: { id: 'missing-attendance' } } as unknown as Request;
      const res = createResponse();

      mockedPrisma.attendance.findUnique.mockResolvedValue(null);

      await undoCheckIn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Attendance record not found' });
    });

    it('successfully deletes attendance in undoCheckIn', async () => {
      const req = { params: { id: 'attendance-1' } } as unknown as Request;
      const res = createResponse();

      mockedPrisma.attendance.findUnique.mockResolvedValue({ id: 'attendance-1' });
      mockedPrisma.attendance.delete.mockResolvedValue({ id: 'attendance-1' });

      await undoCheckIn(req, res);

      expect(mockedPrisma.attendance.delete).toHaveBeenCalledWith({
        where: { id: 'attendance-1' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Check-in undone successfully.',
        attendanceId: 'attendance-1',
      });
    });

    it('returns 500 on unexpected errors', async () => {
      const req = { params: { id: 'attendance-1' } } as unknown as Request;
      const res = createResponse();

      mockedPrisma.attendance.findUnique.mockRejectedValue(new Error('db down'));

      await undoCheckIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to undo check-in' });
    });
  });
});
