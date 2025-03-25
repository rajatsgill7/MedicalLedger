import { storage } from '../server/storage';
import { UserRole } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log('Creating dummy data...');
    
    // Create admin
    const admin = await storage.createUser({
      username: 'admin',
      password: await hashPassword('password123'),
      fullName: 'System Administrator',
      email: 'admin@medivault.com',
      role: UserRole.ADMIN,
      specialty: null
    });
    console.log(`Created admin: ${admin.fullName} (ID: ${admin.id})`);
    
    // Create doctors
    const doctors = [];
    doctors.push(await storage.createUser({
      username: 'dr.smith',
      password: await hashPassword('password123'),
      fullName: 'Dr. John Smith',
      email: 'dr.smith@medivault.com',
      role: UserRole.DOCTOR,
      specialty: 'Cardiology'
    }));
    
    doctors.push(await storage.createUser({
      username: 'dr.patel',
      password: await hashPassword('password123'),
      fullName: 'Dr. Anita Patel',
      email: 'dr.patel@medivault.com',
      role: UserRole.DOCTOR,
      specialty: 'Neurology'
    }));
    
    doctors.push(await storage.createUser({
      username: 'dr.johnson',
      password: await hashPassword('password123'),
      fullName: 'Dr. Mark Johnson',
      email: 'dr.johnson@medivault.com',
      role: UserRole.DOCTOR,
      specialty: 'Pediatrics'
    }));
    
    console.log(`Created ${doctors.length} doctors`);
    
    // Create patients
    const patients = [];
    patients.push(await storage.createUser({
      username: 'patient1',
      password: await hashPassword('password123'),
      fullName: 'Sarah Wilson',
      email: 'sarah@example.com',
      role: UserRole.PATIENT,
      specialty: null
    }));
    
    patients.push(await storage.createUser({
      username: 'patient2',
      password: await hashPassword('password123'),
      fullName: 'Michael Chen',
      email: 'michael@example.com',
      role: UserRole.PATIENT,
      specialty: null
    }));
    
    patients.push(await storage.createUser({
      username: 'patient3',
      password: await hashPassword('password123'),
      fullName: 'Emma Rodriguez',
      email: 'emma@example.com',
      role: UserRole.PATIENT,
      specialty: null
    }));
    
    console.log(`Created ${patients.length} patients`);
    
    // Create medical records for each patient
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    // Create records for each patient
    for (const patient of patients) {
      // Each patient gets 3 records, one from each doctor
      await storage.createRecord({
        title: 'Annual Physical Examination',
        patientId: patient.id,
        recordType: 'Examination',
        recordDate: today.toISOString().split('T')[0],
        doctorId: doctors[0].id,
        doctorName: doctors[0].fullName,
        notes: `Regular checkup for ${patient.fullName}. Vital signs normal. No major concerns.`,
        fileUrl: null,
        verified: true
      });
      
      await storage.createRecord({
        title: 'Blood Test Results',
        patientId: patient.id,
        recordType: 'Laboratory',
        recordDate: oneMonthAgo.toISOString().split('T')[0],
        doctorId: doctors[1].id,
        doctorName: doctors[1].fullName,
        notes: `Complete blood count for ${patient.fullName}. All parameters within normal range.`,
        fileUrl: null,
        verified: true
      });
      
      await storage.createRecord({
        title: 'Vaccination Record',
        patientId: patient.id,
        recordType: 'Immunization',
        recordDate: twoMonthsAgo.toISOString().split('T')[0],
        doctorId: doctors[2].id,
        doctorName: doctors[2].fullName,
        notes: `${patient.fullName} received annual flu vaccine. No adverse reactions.`,
        fileUrl: null,
        verified: true
      });
    }
    
    console.log('Created medical records for patients');
    
    // Create access requests for all doctors to all patients
    for (const doctor of doctors) {
      for (const patient of patients) {
        await storage.createAccessRequest({
          doctorId: doctor.id,
          patientId: patient.id,
          purpose: 'Ongoing care',
          status: 'approved',
          requestDate: new Date().toISOString(),
          duration: 30, // 30 days
          notes: `Request for ongoing medical care for ${patient.fullName} from ${doctor.fullName}`
        });
      }
    }
    
    console.log('Created access requests and approvals');
    
    // Create some audit logs
    await storage.createAuditLog({
      action: 'LOGIN',
      userId: admin.id,
      details: 'Admin logged in',
      ipAddress: '192.168.1.1',
      timestamp: new Date()
    });
    
    for (const doctor of doctors) {
      await storage.createAuditLog({
        action: 'VIEW_RECORD',
        userId: doctor.id,
        details: `Viewed patient records`,
        ipAddress: '192.168.1.2',
        timestamp: new Date()
      });
    }
    
    console.log('Created audit logs');
    
    console.log('Dummy data creation complete');
  } catch (error) {
    console.error('Error creating dummy data:', error);
  }
}

main();