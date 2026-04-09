import 'dotenv/config';
import { EquipmentCondition, MemberStatus, PaymentMethod, Role } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { hashPassword } from '../src/utils/auth';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME ?? 'owner';
  const staffUsername = process.env.SEED_STAFF_USERNAME ?? 'staff';
  const ownerPassword = requiredEnv('SEED_OWNER_PASSWORD');
  const staffPassword = requiredEnv('SEED_STAFF_PASSWORD');
  const ownerPasswordHash = await hashPassword(ownerPassword);
  const staffPasswordHash = await hashPassword(staffPassword);

  // Seed accounts from environment variables to avoid committing credentials.
  const users = [
    {
      username: ownerUsername,
      passwordHash: ownerPasswordHash,
      role: Role.ADMIN,
    },
    {
      username: staffUsername,
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash: user.passwordHash,
        role: user.role,
      },
      create: user,
    });
  }

  const ownerUser = await prisma.user.findUnique({
    where: { username: ownerUsername },
    select: { id: true },
  });
  const staffUser = await prisma.user.findUnique({
    where: { username: staffUsername },
    select: { id: true },
  });

  if (!ownerUser || !staffUser) {
    throw new Error('Seed users are required before creating related dev data.');
  }

  const membershipPlanSeeds = [
    {
      name: 'Daily Pass',
      description: 'Single-day gym access (dev seed)',
      durationDays: 1,
      price: '80.00',
      isActive: true,
    },
    {
      name: 'Monthly Basic',
      description: '30-day membership (dev seed)',
      durationDays: 30,
      price: '999.00',
      isActive: true,
    },
    {
      name: 'Quarterly Plus',
      description: '90-day membership with coaching session (dev seed)',
      durationDays: 90,
      price: '2599.00',
      isActive: true,
    },
  ];

  const membershipPlansByName = new Map<string, string>();

  for (const plan of membershipPlanSeeds) {
    const existingPlan = await prisma.membershipPlan.findFirst({
      where: { name: plan.name },
      select: { id: true },
    });

    if (existingPlan) {
      membershipPlansByName.set(plan.name, existingPlan.id);
      continue;
    }

    const createdPlan = await prisma.membershipPlan.create({
      data: plan,
      select: { id: true },
    });
    membershipPlansByName.set(plan.name, createdPlan.id);
  }

  const memberSeeds = [
    {
      firstName: 'Carlos',
      lastName: 'Reyes',
      contactNumber: '09170000001',
      joinDate: new Date('2026-01-15T08:00:00.000Z'),
      expiryDate: new Date('2026-04-15T08:00:00.000Z'),
      status: MemberStatus.ACTIVE,
    },
    {
      firstName: 'Mina',
      lastName: 'Santos',
      contactNumber: '09170000002',
      joinDate: new Date('2025-12-10T09:00:00.000Z'),
      expiryDate: new Date('2026-01-10T09:00:00.000Z'),
      status: MemberStatus.EXPIRED,
    },
    {
      firstName: 'Jules',
      lastName: 'Navarro',
      contactNumber: '09170000003',
      joinDate: new Date('2026-02-20T10:00:00.000Z'),
      expiryDate: null,
      status: MemberStatus.INACTIVE,
    },
  ];

  const membersByContact = new Map<string, string>();

  for (const member of memberSeeds) {
    const savedMember = await prisma.member.upsert({
      where: { contactNumber: member.contactNumber },
      update: {
        firstName: member.firstName,
        lastName: member.lastName,
        joinDate: member.joinDate,
        expiryDate: member.expiryDate,
        status: member.status,
      },
      create: member,
      select: { id: true, contactNumber: true },
    });

    membersByContact.set(savedMember.contactNumber, savedMember.id);
  }

  const paymentSeeds = [
    {
      memberContact: '09170000001',
      planName: 'Monthly Basic',
      amount: '999.00',
      paymentMethod: PaymentMethod.CASH,
      processedById: ownerUser.id,
      transactionDate: new Date('2026-03-01T09:30:00.000Z'),
    },
    {
      memberContact: '09170000002',
      planName: 'Daily Pass',
      amount: '80.00',
      paymentMethod: PaymentMethod.GCASH,
      processedById: staffUser.id,
      transactionDate: new Date('2026-02-15T11:15:00.000Z'),
    },
  ];

  for (const payment of paymentSeeds) {
    const memberId = membersByContact.get(payment.memberContact);
    const planId = membershipPlansByName.get(payment.planName);

    if (!memberId || !planId) {
      throw new Error(`Missing relation for payment seed: ${payment.memberContact} / ${payment.planName}`);
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        memberId,
        planId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionDate: payment.transactionDate,
      },
      select: { id: true },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          memberId,
          planId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          processedById: payment.processedById,
          transactionDate: payment.transactionDate,
        },
      });
    }
  }

  const attendanceSeeds = [
    {
      memberContact: '09170000001',
      checkInTime: new Date('2026-03-02T06:00:00.000Z'),
    },
    {
      memberContact: '09170000001',
      checkInTime: new Date('2026-03-05T18:00:00.000Z'),
    },
    {
      memberContact: '09170000002',
      checkInTime: new Date('2026-02-16T07:45:00.000Z'),
    },
  ];

  for (const attendance of attendanceSeeds) {
    const memberId = membersByContact.get(attendance.memberContact);

    if (!memberId) {
      throw new Error(`Missing member for attendance seed: ${attendance.memberContact}`);
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        memberId,
        checkInTime: attendance.checkInTime,
      },
      select: { id: true },
    });

    if (!existingAttendance) {
      await prisma.attendance.create({
        data: {
          memberId,
          checkInTime: attendance.checkInTime,
        },
      });
    }
  }

  const equipmentSeeds = [
    {
      itemName: 'Treadmill X100',
      quantity: 4,
      condition: EquipmentCondition.GOOD,
      lastChecked: new Date('2026-03-20T08:30:00.000Z'),
    },
    {
      itemName: 'Olympic Barbell',
      quantity: 8,
      condition: EquipmentCondition.GOOD,
      lastChecked: new Date('2026-03-20T08:35:00.000Z'),
    },
    {
      itemName: 'Cable Machine A',
      quantity: 1,
      condition: EquipmentCondition.MAINTENANCE,
      lastChecked: new Date('2026-03-18T14:00:00.000Z'),
    },
  ];

  for (const equipment of equipmentSeeds) {
    const existingEquipment = await prisma.equipment.findFirst({
      where: { itemName: equipment.itemName },
      select: { id: true },
    });

    if (!existingEquipment) {
      await prisma.equipment.create({ data: equipment });
    }
  }

  const supplierSeeds = [
    {
      name: 'FitSupply Trading',
      serviceCategory: 'Supplies',
      contactPerson: 'Andrea Lim',
      contactNumber: '0281234567',
      address: 'Quezon City',
    },
    {
      name: 'IronWorks PH',
      serviceCategory: 'Equipment Repair',
      contactPerson: 'Mark Dela Cruz',
      contactNumber: '0287654321',
      address: 'Makati City',
    },
  ];

  const suppliersByName = new Map<string, string>();

  for (const supplier of supplierSeeds) {
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: supplier.name },
      select: { id: true },
    });

    if (existingSupplier) {
      suppliersByName.set(supplier.name, existingSupplier.id);
      continue;
    }

    const createdSupplier = await prisma.supplier.create({
      data: supplier,
      select: { id: true },
    });
    suppliersByName.set(supplier.name, createdSupplier.id);
  }

  const supplierTransactionSeeds = [
    {
      supplierName: 'FitSupply Trading',
      itemsPurchased: 'Yoga Mats (20 pcs) - dev seed',
      totalCost: '12000.00',
      transactionDate: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      supplierName: 'IronWorks PH',
      itemsPurchased: 'Dumbbell Set 5kg-25kg - dev seed',
      totalCost: '45000.00',
      transactionDate: new Date('2026-03-12T13:30:00.000Z'),
    },
  ];

  for (const transaction of supplierTransactionSeeds) {
    const supplierId = suppliersByName.get(transaction.supplierName);

    if (!supplierId) {
      throw new Error(`Missing supplier for transaction seed: ${transaction.supplierName}`);
    }

    const existingTransaction = await prisma.supplierTransaction.findFirst({
      where: {
        supplierId,
        itemsPurchased: transaction.itemsPurchased,
        totalCost: transaction.totalCost,
        transactionDate: transaction.transactionDate,
      },
      select: { id: true },
    });

    if (!existingTransaction) {
      await prisma.supplierTransaction.create({
        data: {
          supplierId,
          itemsPurchased: transaction.itemsPurchased,
          totalCost: transaction.totalCost,
          transactionDate: transaction.transactionDate,
        },
      });
    }
  }

  console.log('Seed complete. Login accounts created/updated:');
  console.log(`- Owner role: username="${ownerUsername}"`);
  console.log(`- Staff role: username="${staffUsername}"`);
  console.log('Additional dev records have been seeded across all non-user tables.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
