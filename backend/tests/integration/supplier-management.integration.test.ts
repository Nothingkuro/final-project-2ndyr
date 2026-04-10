import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import prisma, { disconnectPrisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/auth';

function getCookie(setCookieHeader: string[] | string | undefined): string {
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : setCookieHeader ?? '';
}

describe('Supplier management API', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const staffUsername = `jest-staff-supplier-${suffix}`;
  const staffPassword = `P@ss-staff-${suffix}`;
  const adminUsername = `jest-admin-supplier-${suffix}`;
  const adminPassword = `P@ss-admin-${suffix}`;

  let staffCookie = '';
  let adminCookie = '';

  let createdSupplierId: string | null = null;
  let createdTransactionId: string | null = null;

  async function loginUser(username: string, password: string, role: 'Staff' | 'Owner') {
    const loginResponse = await request(app).post('/api/auth/login').send({
      username,
      password,
      role,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.username).toBe(username);

    const cookie = getCookie(loginResponse.headers['set-cookie']);
    expect(cookie).toContain('arrowhead_session=');

    return cookie;
  }

  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          username: staffUsername,
          passwordHash: await hashPassword(staffPassword),
          role: Role.STAFF,
        },
        {
          username: adminUsername,
          passwordHash: await hashPassword(adminPassword),
          role: Role.ADMIN,
        },
      ],
    });

    staffCookie = await loginUser(staffUsername, staffPassword, 'Staff');
    adminCookie = await loginUser(adminUsername, adminPassword, 'Owner');
  });

  afterAll(async () => {
    if (createdSupplierId) {
      await prisma.supplier.deleteMany({
        where: { id: createdSupplierId },
      });
    }

    await prisma.user.deleteMany({
      where: {
        username: {
          in: [staffUsername, adminUsername],
        },
      },
    });

    await disconnectPrisma();
  });

  it('rejects unauthenticated access to GET /api/suppliers', async () => {
    const response = await request(app).get('/api/suppliers');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('rejects unauthenticated access to POST /api/suppliers', async () => {
    const response = await request(app)
      .post('/api/suppliers')
      .send({
        name: `No Auth Supplier ${suffix}`,
        contactNumber: '09170000010',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('lets authenticated staff list suppliers', async () => {
    const response = await request(app)
      .get('/api/suppliers?page=1&pageSize=10')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(10);
  });

  it('lets authenticated staff list supplier service categories', async () => {
    const response = await request(app)
      .get('/api/suppliers/categories')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('rejects staff from creating suppliers', async () => {
    const response = await request(app)
      .post('/api/suppliers')
      .set('Cookie', staffCookie)
      .send({
        name: `Staff Cannot Create ${suffix}`,
        contactNumber: '09170000011',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('creates supplier as admin', async () => {
    const response = await request(app)
      .post('/api/suppliers')
      .set('Cookie', adminCookie)
      .send({
        name: `Supplier ${suffix}`,
        serviceCategory: 'Water Supplier',
        contactPerson: 'Alex Support',
        contactNumber: '09170000012',
        address: 'Mandaluyong City',
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(`Supplier ${suffix}`);
    expect(response.body.serviceCategory).toBe('Water Supplier');
    expect(response.body.contactNumber).toBe('09170000012');

    createdSupplierId = response.body.id;
    expect(typeof createdSupplierId).toBe('string');
  });

  it('rejects supplier create when contact number exceeds 11 digits', async () => {
    const response = await request(app)
      .post('/api/suppliers')
      .set('Cookie', adminCookie)
      .send({
        name: `Too Long Supplier ${suffix}`,
        serviceCategory: 'Water Supplier',
        contactPerson: 'Validation User',
        contactNumber: '091712345678',
        address: 'Pasig City',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Contact number must contain at most 11 digits',
    });
  });

  it('includes created supplier in search results', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .get(`/api/suppliers?search=${encodeURIComponent(String(suffix))}&page=1&pageSize=10`)
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    const found = response.body.items.find((item: { id: string }) => item.id === createdSupplierId);
    expect(found).toBeDefined();
  });

  it('includes created supplier in category filter results', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .get('/api/suppliers?serviceCategory=Water%20Supplier&page=1&pageSize=10')
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    const found = response.body.items.find((item: { id: string }) => item.id === createdSupplierId);
    expect(found).toBeDefined();
  });

  it('updates supplier as admin', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .put(`/api/suppliers/${createdSupplierId}`)
      .set('Cookie', adminCookie)
      .send({
        serviceCategory: 'Equipment Repair',
        contactPerson: 'Jordan Mechanic',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdSupplierId);
    expect(response.body.serviceCategory).toBe('Equipment Repair');
    expect(response.body.contactPerson).toBe('Jordan Mechanic');
  });

  it('rejects transaction creation with invalid payload', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .post(`/api/suppliers/${createdSupplierId}/transactions`)
      .set('Cookie', adminCookie)
      .send({
        itemsPurchased: '',
        totalCost: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('creates supplier transaction as admin', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .post(`/api/suppliers/${createdSupplierId}/transactions`)
      .set('Cookie', adminCookie)
      .send({
        itemsPurchased: 'Cleaning supplies and replacement hoses',
        totalCost: 3450.5,
      });

    expect(response.status).toBe(201);
    expect(response.body.supplierId).toBe(createdSupplierId);
    expect(response.body.itemsPurchased).toBe('Cleaning supplies and replacement hoses');
    expect(response.body.totalCost).toBe(3450.5);

    createdTransactionId = response.body.id;
  });

  it('lists supplier transactions for staff', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .get(`/api/suppliers/${createdSupplierId}/transactions?page=1&pageSize=10`)
      .set('Cookie', staffCookie);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.total).toBeGreaterThanOrEqual(1);

    const found = response.body.items.find((item: { id: string }) => item.id === createdTransactionId);
    expect(found).toBeDefined();
  });

  it('rejects staff from creating supplier transactions', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .post(`/api/suppliers/${createdSupplierId}/transactions`)
      .set('Cookie', staffCookie)
      .send({
        itemsPurchased: 'Unauthorized entry',
        totalCost: 100,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('deletes supplier as admin', async () => {
    expect(createdSupplierId).toBeTruthy();

    const response = await request(app)
      .delete(`/api/suppliers/${createdSupplierId}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(204);

    const verifyResponse = await request(app)
      .get(`/api/suppliers/${createdSupplierId}/transactions?page=1&pageSize=10`)
      .set('Cookie', adminCookie);

    expect(verifyResponse.status).toBe(404);
    expect(verifyResponse.body).toEqual({ error: 'Supplier not found' });

    createdSupplierId = null;
  });
});
