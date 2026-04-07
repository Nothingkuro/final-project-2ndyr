import { EquipmentCondition, MemberStatus, PaymentMethod, Role } from '@prisma/client';
import prisma from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function assertSafeDatabaseUrl(): void {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL is required for E2E seeding.');
	}

	const isLikelyTestDatabase = /test/i.test(databaseUrl);
	if (!isLikelyTestDatabase && process.env.E2E_ALLOW_NON_TEST_DB_RESET !== 'true') {
		throw new Error(
			'Refusing to seed DATABASE_URL because it does not look like a test database. ' +
				'Include "test" in the URL or set E2E_ALLOW_NON_TEST_DB_RESET=true to override.',
		);
	}
}

function requiredEnv(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export async function seedE2EDatabase(): Promise<void> {
	assertSafeDatabaseUrl();

	const ownerUsername = process.env.SEED_OWNER_USERNAME ?? 'owner';
	const staffUsername = process.env.SEED_STAFF_USERNAME ?? 'staff';
	const ownerPasswordHash = await hashPassword(requiredEnv('SEED_OWNER_PASSWORD'));
	const staffPasswordHash = await hashPassword(requiredEnv('SEED_STAFF_PASSWORD'));

	await prisma.$transaction(async (tx) => {
		const ownerUser = await tx.user.create({
			data: {
				username: ownerUsername,
				passwordHash: ownerPasswordHash,
				role: Role.ADMIN,
			},
			select: { id: true },
		});

		const staffUser = await tx.user.create({
			data: {
				username: staffUsername,
				passwordHash: staffPasswordHash,
				role: Role.STAFF,
			},
			select: { id: true },
		});

		const dailyPassPlan = await tx.membershipPlan.create({
			data: {
				name: 'Daily Pass',
				description: 'Single-day gym access (e2e seed)',
				durationDays: 1,
				price: '80.00',
				isActive: true,
			},
			select: { id: true },
		});

		const monthlyBasicPlan = await tx.membershipPlan.create({
			data: {
				name: 'Monthly Basic',
				description: '30-day membership (e2e seed)',
				durationDays: 30,
				price: '999.00',
				isActive: true,
			},
			select: { id: true },
		});

		await tx.membershipPlan.create({
			data: {
				name: 'Quarterly Plus',
				description: '90-day membership with coaching session (e2e seed)',
				durationDays: 90,
				price: '2599.00',
				isActive: true,
			},
		});

		const activeMember = await tx.member.create({
			data: {
				firstName: 'Carlos',
				lastName: 'Reyes',
				contactNumber: '09170000001',
				joinDate: new Date('2026-01-15T08:00:00.000Z'),
				expiryDate: new Date('2026-04-15T08:00:00.000Z'),
				status: MemberStatus.ACTIVE,
			},
			select: { id: true },
		});

		const expiredMember = await tx.member.create({
			data: {
				firstName: 'Mina',
				lastName: 'Santos',
				contactNumber: '09170000002',
				joinDate: new Date('2025-12-10T09:00:00.000Z'),
				expiryDate: new Date('2026-01-10T09:00:00.000Z'),
				status: MemberStatus.EXPIRED,
			},
			select: { id: true },
		});

		await tx.member.create({
			data: {
				firstName: 'Jules',
				lastName: 'Navarro',
				contactNumber: '09170000003',
				joinDate: new Date('2026-02-20T10:00:00.000Z'),
				expiryDate: null,
				status: MemberStatus.INACTIVE,
			},
		});

		await tx.payment.createMany({
			data: [
				{
					memberId: activeMember.id,
					planId: monthlyBasicPlan.id,
					amount: '999.00',
					paymentMethod: PaymentMethod.CASH,
					processedById: ownerUser.id,
					transactionDate: new Date('2026-03-01T09:30:00.000Z'),
				},
				{
					memberId: expiredMember.id,
					planId: dailyPassPlan.id,
					amount: '80.00',
					paymentMethod: PaymentMethod.GCASH,
					processedById: staffUser.id,
					transactionDate: new Date('2026-02-15T11:15:00.000Z'),
				},
			],
		});

		await tx.attendance.createMany({
			data: [
				{
					memberId: activeMember.id,
					checkInTime: new Date('2026-03-02T06:00:00.000Z'),
				},
				{
					memberId: activeMember.id,
					checkInTime: new Date('2026-03-05T18:00:00.000Z'),
				},
				{
					memberId: expiredMember.id,
					checkInTime: new Date('2026-02-16T07:45:00.000Z'),
				},
			],
		});

		await tx.equipment.createMany({
			data: [
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
			],
		});

		const fitSupply = await tx.supplier.create({
			data: {
				name: 'FitSupply Trading',
				contactPerson: 'Andrea Lim',
				contactNumber: '0281234567',
				address: 'Quezon City',
			},
			select: { id: true },
		});

		const ironWorks = await tx.supplier.create({
			data: {
				name: 'IronWorks PH',
				contactPerson: 'Mark Dela Cruz',
				contactNumber: '0287654321',
				address: 'Makati City',
			},
			select: { id: true },
		});

		await tx.supplierTransaction.createMany({
			data: [
				{
					supplierId: fitSupply.id,
					itemsPurchased: 'Yoga Mats (20 pcs) - e2e seed',
					totalCost: '12000.00',
					transactionDate: new Date('2026-03-10T10:00:00.000Z'),
				},
				{
					supplierId: ironWorks.id,
					itemsPurchased: 'Dumbbell Set 5kg-25kg - e2e seed',
					totalCost: '45000.00',
					transactionDate: new Date('2026-03-12T13:30:00.000Z'),
				},
			],
		});
	});

	process.stdout.write('[playwright-db] e2e seed complete\n');
}

if (require.main === module) {
	seedE2EDatabase()
		.catch((error) => {
			console.error('E2E seed failed:', error);
			process.exit(1);
		})
		.finally(async () => {
			await prisma.$disconnect();
		});
}
