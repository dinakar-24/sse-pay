-- Insert the 6 admin accounts with specific roles
INSERT INTO public.admins (email, password_hash, full_name, role, dob) VALUES
('masteradmin@sseptp.org', '24102004', 'Master Administrator', 'master_admin', '24102004'),
('useradmin@sseptp.org', '24102004', 'User Management Admin', 'user_management_admin', '24102004'),
('compliantadmin@sseptp.org', '24102004', 'Complaint Administrator', 'complaint_admin', '24102004'),
('libraryadmin@sseptp.org', '24102004', 'Library Administrator', 'library_admin', '24102004'),
('culturalsadmin@sseptp.org', '24102004', 'Cultural Administrator', 'cultural_admin', '24102004'),
('ivadmin@sseptp.org', '24102004', 'IV Administrator', 'iv_admin', '24102004')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  dob = EXCLUDED.dob;