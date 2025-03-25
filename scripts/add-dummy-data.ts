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
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Record types
    const recordTypes = [
      'Examination', 'Laboratory', 'Immunization', 'Prescription', 
      'Surgical', 'Radiology', 'Consultation', 'Emergency', 'Discharge'
    ];
    
    // Create records for each patient
    for (const patient of patients) {
      // Basic records - each patient gets these
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
        title: 'Complete Blood Count',
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
        title: 'Annual Flu Vaccination',
        patientId: patient.id,
        recordType: 'Immunization',
        recordDate: twoMonthsAgo.toISOString().split('T')[0],
        doctorId: doctors[2].id,
        doctorName: doctors[2].fullName,
        notes: `${patient.fullName} received annual flu vaccine. No adverse reactions.`,
        fileUrl: null,
        verified: true
      });
      
      // Patient 1 - Additional records for Sarah Wilson
      if (patient.id === patients[0].id) {
        await storage.createRecord({
          title: 'Chest X-Ray Results',
          patientId: patient.id,
          recordType: 'Radiology',
          recordDate: threeMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[0].id,
          doctorName: doctors[0].fullName,
          notes: 'Chest X-ray shows normal lung fields. No evidence of active disease.',
          fileUrl: 'https://example.com/xray123',
          verified: true
        });
        
        await storage.createRecord({
          title: 'Cardiac Consultation',
          patientId: patient.id,
          recordType: 'Consultation',
          recordDate: sixMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[0].id,
          doctorName: doctors[0].fullName,
          notes: 'Patient referred for preventive cardiac screening. EKG normal, stress test within normal limits.',
          fileUrl: null,
          verified: true
        });
        
        await storage.createRecord({
          title: 'Lipid Panel Results',
          patientId: patient.id,
          recordType: 'Laboratory',
          recordDate: oneYearAgo.toISOString().split('T')[0],
          doctorId: doctors[0].id,
          doctorName: doctors[0].fullName,
          notes: 'Cholesterol: 185 mg/dL (desirable), HDL: 62 mg/dL (good), LDL: 100 mg/dL (optimal), Triglycerides: 120 mg/dL (normal).',
          fileUrl: null,
          verified: true
        });
      }
      
      // Patient 2 - Additional records for Michael Chen
      if (patient.id === patients[1].id) {
        await storage.createRecord({
          title: 'Allergy Test Results',
          patientId: patient.id,
          recordType: 'Laboratory',
          recordDate: threeMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[1].id,
          doctorName: doctors[1].fullName,
          notes: 'Patient shows mild allergic reaction to specific tree pollens. Recommend seasonal antihistamines.',
          fileUrl: null,
          verified: true
        });
        
        await storage.createRecord({
          title: 'Dermatology Consultation',
          patientId: patient.id,
          recordType: 'Consultation',
          recordDate: sixMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[1].id,
          doctorName: doctors[1].fullName,
          notes: 'Patient presented with mild eczema on hands. Prescribed topical corticosteroid cream.',
          fileUrl: 'https://example.com/derm456',
          verified: true
        });
        
        await storage.createRecord({
          title: 'COVID-19 Vaccination',
          patientId: patient.id,
          recordType: 'Immunization',
          recordDate: oneYearAgo.toISOString().split('T')[0],
          doctorId: doctors[1].id,
          doctorName: doctors[1].fullName,
          notes: 'Patient received COVID-19 booster vaccination. No adverse reactions observed during 15-minute observation.',
          fileUrl: null,
          verified: true
        });
      }
      
      // Patient 3 - Additional records for Emma Rodriguez
      if (patient.id === patients[2].id) {
        await storage.createRecord({
          title: 'Prenatal Checkup',
          patientId: patient.id,
          recordType: 'Examination',
          recordDate: threeMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[2].id,
          doctorName: doctors[2].fullName,
          notes: 'Routine 20-week prenatal visit. Fetal development normal. All measurements within expected range.',
          fileUrl: null,
          verified: true
        });
        
        await storage.createRecord({
          title: 'Ultrasound Results',
          patientId: patient.id,
          recordType: 'Radiology',
          recordDate: sixMonthsAgo.toISOString().split('T')[0],
          doctorId: doctors[2].id,
          doctorName: doctors[2].fullName,
          notes: 'Obstetric ultrasound confirms single viable pregnancy. Estimated due date remains consistent with previous calculations.',
          fileUrl: 'https://example.com/ultrasound789',
          verified: true
        });
        
        await storage.createRecord({
          title: 'Glucose Tolerance Test',
          patientId: patient.id,
          recordType: 'Laboratory',
          recordDate: oneYearAgo.toISOString().split('T')[0],
          doctorId: doctors[2].id, 
          doctorName: doctors[2].fullName,
          notes: 'Standard glucose tolerance test performed. Results indicate normal glucose metabolism. No signs of gestational diabetes.',
          fileUrl: null,
          verified: true
        });
      }
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