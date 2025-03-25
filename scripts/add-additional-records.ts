import { storage } from '../server/storage';
import { db } from '../server/db';
import { eq } from 'drizzle-orm';
import { users } from '../shared/schema';

async function main() {
  try {
    console.log('Adding additional medical records...');
    
    // Fetch existing users
    const existingUsers = await db.select().from(users);
    
    // Find patients and doctors
    const patients = existingUsers.filter(user => user.role === 'patient');
    const doctors = existingUsers.filter(user => user.role === 'doctor');
    
    if (patients.length < 3 || doctors.length < 3) {
      console.error('Not enough patients or doctors in the database. Need at least 3 of each.');
      return;
    }
    
    // Create dates
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Patient 1 - Additional records
    await storage.createRecord({
      title: 'Chest X-Ray Results',
      patientId: patients[0].id,
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
      patientId: patients[0].id,
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
      patientId: patients[0].id,
      recordType: 'Laboratory',
      recordDate: oneYearAgo.toISOString().split('T')[0],
      doctorId: doctors[0].id,
      doctorName: doctors[0].fullName,
      notes: 'Cholesterol: 185 mg/dL (desirable), HDL: 62 mg/dL (good), LDL: 100 mg/dL (optimal), Triglycerides: 120 mg/dL (normal).',
      fileUrl: null,
      verified: true
    });
    
    // Patient 2 - Additional records
    await storage.createRecord({
      title: 'Allergy Test Results',
      patientId: patients[1].id,
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
      patientId: patients[1].id,
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
      patientId: patients[1].id,
      recordType: 'Immunization',
      recordDate: oneYearAgo.toISOString().split('T')[0],
      doctorId: doctors[1].id,
      doctorName: doctors[1].fullName,
      notes: 'Patient received COVID-19 booster vaccination. No adverse reactions observed during 15-minute observation.',
      fileUrl: null,
      verified: true
    });
    
    // Patient 3 - Additional records
    await storage.createRecord({
      title: 'Prenatal Checkup',
      patientId: patients[2].id,
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
      patientId: patients[2].id,
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
      patientId: patients[2].id,
      recordType: 'Laboratory',
      recordDate: oneYearAgo.toISOString().split('T')[0],
      doctorId: doctors[2].id, 
      doctorName: doctors[2].fullName,
      notes: 'Standard glucose tolerance test performed. Results indicate normal glucose metabolism. No signs of gestational diabetes.',
      fileUrl: null,
      verified: true
    });
    
    console.log('Added additional medical records successfully');
  } catch (error) {
    console.error('Error adding additional records:', error);
  }
}

main();