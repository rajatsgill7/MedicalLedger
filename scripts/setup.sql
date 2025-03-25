-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'patient',
    specialty TEXT,  -- Only applicable for doctors
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_preferences TEXT -- Stored as JSON string
);

-- Create the records table
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL,
    doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    doctor_name TEXT,
    record_date DATE NOT NULL,
    notes TEXT,
    file_url TEXT, -- File storage URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);

-- Create the access_requests table
CREATE TABLE access_requests (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    duration INTEGER NOT NULL, -- Duration in days
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    limited_scope BOOLEAN DEFAULT FALSE
);

-- Create the audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
);
