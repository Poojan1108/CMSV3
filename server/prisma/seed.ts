import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ResolveX CMS Database...');

  // 1. Create Departments
  const deptMaintenance = await prisma.department.upsert({
    where: { id: 'dept-maintenance' },
    update: {},
    create: {
      id: 'dept-maintenance',
      name: 'Maintenance & Estate Services',
      orgKey: 'COLLEGE',
    },
  });

  const deptIT = await prisma.department.upsert({
    where: { id: 'dept-it' },
    update: {},
    create: {
      id: 'dept-it',
      name: 'IT & Digital Infrastructure',
      orgKey: 'COLLEGE',
    },
  });

  const deptHostel = await prisma.department.upsert({
    where: { id: 'dept-hostel' },
    update: {},
    create: {
      id: 'dept-hostel',
      name: 'Hostel & Residential Welfare',
      orgKey: 'COLLEGE',
    },
  });

  // Password Hash for all seed accounts: "Password@123"
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', salt);

  // 2. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      name: 'Dr. Ramesh Sharma (Dean)',
      email: 'admin@college.edu',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      orgKey: 'COLLEGE',
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: 'alex.staff@college.edu' },
    update: {},
    create: {
      name: 'Alex Vance (IT Lead)',
      email: 'alex.staff@college.edu',
      passwordHash: defaultPasswordHash,
      role: 'STAFF',
      orgKey: 'COLLEGE',
      departmentId: deptIT.id,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'priya.staff@college.edu' },
    update: {},
    create: {
      name: 'Priya Nair (Hostel Warden)',
      email: 'priya.staff@college.edu',
      passwordHash: defaultPasswordHash,
      role: 'STAFF',
      orgKey: 'COLLEGE',
      departmentId: deptHostel.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student.rahul@college.edu' },
    update: {},
    create: {
      name: 'Rahul Verma',
      email: 'student.rahul@college.edu',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      orgKey: 'COLLEGE',
    },
  });

  // 3. Create Demo Tickets
  const ticket1 = await prisma.ticket.upsert({
    where: { id: 'CMS-2026-1001' },
    update: {},
    create: {
      id: 'CMS-2026-1001',
      title: 'Lab 3 Ethernet Ports & High-Speed Switch Down',
      description: 'Network switch in Computer Lab 3 is completely unresponsive. CS batch unable to take online lab exams.',
      category: 'Lab Equipment',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      location: 'Block C - Computer Lab 3',
      orgKey: 'COLLEGE',
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      assignedToId: staff1.id,
      departmentId: deptIT.id,
      slaResponseDue: new Date(Date.now() + 6 * 3600000),
      slaResolveDue: new Date(Date.now() + 24 * 3600000),
      history: {
        create: [
          {
            status: 'PENDING',
            updatedBy: student.name,
            note: 'Complaint registered in system.',
          },
          {
            status: 'IN_PROGRESS',
            updatedBy: staff1.name,
            note: 'Assigned to IT Infrastructure team. Replacing faulty patch cable and resetting core switch.',
          },
        ],
      },
      comments: {
        create: [
          {
            senderName: staff1.name,
            senderRole: 'STAFF',
            senderId: staff1.id,
            text: 'We have dispatched hardware engineer to inspect rack switch.',
            isInternal: false,
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { id: 'CMS-2026-1002' },
    update: {},
    create: {
      id: 'CMS-2026-1002',
      title: 'Water Cooler Leakage & Stagnation in Hostel B',
      description: 'The 2nd floor water cooler has been overflowing since morning. Slippery floor posing hazard to residents.',
      category: 'Hostel Facilities',
      priority: 'URGENT',
      status: 'PENDING_CONFIRMATION',
      location: 'Boys Hostel B, 2nd Floor Corridor',
      orgKey: 'COLLEGE',
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      assignedToId: staff2.id,
      departmentId: deptHostel.id,
      resolutionDetails: {
        notes: 'Plumber repaired broken inlet float valve and housekeeping cleaned the corridor.',
        staffName: staff2.name,
        proposedAt: new Date().toISOString(),
      },
      history: {
        create: [
          {
            status: 'PENDING',
            updatedBy: student.name,
            note: 'Complaint registered in system.',
          },
          {
            status: 'PENDING_CONFIRMATION',
            updatedBy: staff2.name,
            note: 'Resolution proposed: Plumber fixed valve. Awaiting student verification.',
          },
        ],
      },
      comments: {
        create: [
          {
            senderName: staff2.name,
            senderRole: 'STAFF',
            senderId: staff2.id,
            text: '[Resolution Proposed] Valve replaced. Please check and confirm.',
            isInternal: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('   - Admin:    admin@college.edu (Password@123)');
  console.log('   - Staff:    alex.staff@college.edu (Password@123)');
  console.log('   - Student:  student.rahul@college.edu (Password@123)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
