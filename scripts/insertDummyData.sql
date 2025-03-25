-- Insert Admin
INSERT INTO users (username, password, full_name, email, role) 
VALUES 
('admin', 'hashed_password', 'System Administrator', 'admin@medivault.com', 'admin');

-- Insert Doctors
INSERT INTO users (username, password, full_name, email, role, specialty) 
VALUES 
('dr.smith', 'hashed_password', 'Dr. John Smith', 'dr.smith@medivault.com', 'doctor', 'Cardiology'),
('dr.patel', 'hashed_password', 'Dr. Anita Patel', 'dr.patel@medivault.com', 'doctor', 'Neurology'),
('dr.johnson', 'hashed_password', 'Dr. Mark Johnson', 'dr.johnson@medivault.com', 'doctor', 'Pediatrics');

-- Insert Patients
INSERT INTO users (username, password, full_name, email, role) 
VALUES 
('patient1', 'hashed_password', 'Sarah Wilson', 'sarah@example.com', 'patient'),
('patient2', 'hashed_password', 'Michael Chen', 'michael@example.com', 'patient'),
('patient3', 'hashed_password', 'Emma Rodriguez', 'emma@example.com', 'patient');

-- Insert Medical Records
INSERT INTO records (patient_id, title, record_type, doctor_id, doctor_name, record_date, notes, file_url, verified)
VALUES
(1, 'Annual Physical Examination', 'Examination', 1, 'Dr. John Smith', '2025-03-01', 'Regular checkup. All good.', NULL, TRUE),
(2, 'Complete Blood Count', 'Laboratory', 2, 'Dr. Anita Patel', '2025-02-15', 'Blood test normal.', NULL, TRUE),
(3, 'Annual Flu Vaccination', 'Immunization', 3, 'Dr. Mark Johnson', '2025-01-10', 'Flu vaccine administered.', NULL, TRUE);

-- Insert Access Requests
INSERT INTO access_requests (doctor_id, patient_id, purpose, duration, notes, status)
VALUES 
(1, 1, 'Ongoing care', 30, 'Dr. Smith requested access for ongoing care.', 'approved'),
(2, 2, 'Follow-up checkup', 30, 'Dr. Patel requested access for a follow-up.', 'approved'),
(3, 3, 'Prenatal care', 30, 'Dr. Johnson requested access for prenatal monitoring.', 'approved');

-- Insert Audit Logs
INSERT INTO audit_logs (user_id, action, details, ip_address)
VALUES 
(1, 'LOGIN', 'Admin logged in', '192.168.1.1'),
(2, 'VIEW_RECORD', 'Dr. Smith viewed a patient record', '192.168.1.2');
