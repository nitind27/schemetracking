-- SQL Script to create a PESA Coordinator user
-- User Category ID: 37 (PESA Coordinator)
-- Example: Creating a user for Taloda taluka

-- First, verify that user_category_id = 37 exists
SELECT * FROM user_category WHERE user_category_id = 37;

-- If the category doesn't exist, create it (though it should already exist)
-- INSERT INTO user_category (category_name) VALUES ('PESA Coordinator');

-- Find the taluka_id for Taloda (तळोदा)
-- You can check the taluka table to find the correct taluka_id
SELECT * FROM taluka WHERE name LIKE '%तळोदा%' OR name LIKE '%taloda%';

-- Example: Create a PESA Coordinator user for Taloda
-- Replace the values below with actual data:
-- - name: User's full name
-- - username: Login username
-- - password: Login password (plain text - ensure your system handles this securely)
-- - contact_no: Contact number
-- - address: User's address
-- - taluka_id: The taluka_id from the taluka table (e.g., for Taloda)
-- - village_id: A village_id from that taluka (optional, can be NULL or 0)
-- - status: 'Active' or 'Inactive'

INSERT INTO users (
    name,
    user_category_id,
    username,
    password,
    contact_no,
    address,
    taluka_id,
    village_id,
    status
) VALUES (
    'PESA Coordinator Taloda',  -- Replace with actual name
    37,                        -- PESA Coordinator category_id
    'pesa_coordinator_taloda', -- Replace with desired username
    'password123',              -- Replace with secure password
    '1234567890',              -- Replace with contact number
    'Taloda, Nandurbar',       -- Replace with address
    (SELECT taluka_id FROM taluka WHERE name = 'तळोदा' LIMIT 1), -- Taloda taluka_id
    NULL,                      -- village_id (can be NULL for PESA Coordinator)
    'Active'
);

-- To create users for other talukas, repeat the INSERT with different taluka_id values
-- Example for other talukas:
-- For Nandurbar: (SELECT taluka_id FROM taluka WHERE name = 'नंदुरबार' LIMIT 1)
-- For Navapur: (SELECT taluka_id FROM taluka WHERE name = 'नवापूर' LIMIT 1)
-- For Shahade: (SELECT taluka_id FROM taluka WHERE name = 'शहादा' LIMIT 1)
-- For Akkalkuva: (SELECT taluka_id FROM taluka WHERE name = 'अक्कलकुवा' LIMIT 1)
-- For Akrani: (SELECT taluka_id FROM taluka WHERE name = 'अक्राणी' LIMIT 1)
-- For Dhadgaon: (SELECT taluka_id FROM taluka WHERE name = 'धडगाव' LIMIT 1)

-- Verify the user was created
SELECT 
    u.user_id,
    u.name,
    u.username,
    u.user_category_id,
    uc.category_name,
    u.taluka_id,
    t.name as taluka_name,
    u.status
FROM users u
LEFT JOIN user_category uc ON u.user_category_id = uc.user_category_id
LEFT JOIN taluka t ON u.taluka_id = t.taluka_id
WHERE u.user_category_id = 37;

