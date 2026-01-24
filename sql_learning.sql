-- ==========================================
-- LEVEL 1: THE BASICS (READING DATA)
-- ==========================================

-- 1. SELECT EVERYTHING
-- The asterisk (*) means "all columns".
-- This fetches every single row and every single column from the machines table.
SELECT * FROM troubleshooting_products;

-- 2. SELECT SPECIFIC COLUMNS
-- Often you don't need everything (like 'created_at' timestamps).
-- This is faster and cleaner.
SELECT name, legacyId FROM troubleshooting_products;

-- 3. FILTERING WITH "WHERE"
-- This is how you find specific data.
-- "Show me the machine with ID 10"
SELECT * FROM troubleshooting_products WHERE id = 10;

-- 4. TEXT SEARCH
-- "Show me the machine named 'Big Drill'"
SELECT * FROM troubleshooting_products WHERE name = 'Big Drill';

-- 5. PARTIAL MATCH (LIKE)
-- "Show me all machines that have 'Drill' in their name"
-- The % symbol is a wildcard (matches anything).
SELECT * FROM troubleshooting_products WHERE name LIKE '%Drill%';

SELECT * from fault_library where fault_code='F001';

-- ==========================================
-- LEVEL 2: THE CONNECTIONS (JOIN)
-- ==========================================

-- Great job! You found the fault correctly.
-- Now, the real power of SQL is connecting tables.

-- In your app, a Machine doesn't store faults directly.
-- It uses a bridge table: 'product_faults'

-- 1. THE PROBLEM
-- If you just look at 'product_faults':
SELECT * FROM product_faults;
-- You only see IDs (product_id, fault_id). You don't know the names!

-- 2. THE SOLUTION (INNER JOIN)
-- We "Join" the 'troubleshooting_products' table to get the machine name.

SELECT 
    troubleshooting_products.name as MachineName, 
    product_faults.view_seq as Sequence
FROM product_faults
JOIN troubleshooting_products 
    ON product_faults.product_id = troubleshooting_products.id;

-- 3. EXPLAINED
-- "FROM product_faults" -> Start with the bridge table.
-- "JOIN troubleshooting_products" -> Bring in the machine table.
-- "ON ..." -> Match them where their IDs are the same.


-- ==========================================
-- YOUR TURN (CHALLENGE):
-- ANSWER TO CHALLENGE:
SELECT 
    product_faults.fault_id, 
    fault_library.name 
FROM product_faults
JOIN fault_library 
    ON product_faults.fault_id = fault_library.id;


-- ==========================================
-- LEVEL 3: THE DEEP JOIN (MANY-TO-MANY)
-- ==========================================

-- You just learned how to link 2 tables.
-- But your app architecture is 3 layers deep:
-- Machine -> [ProductFault] -> Fault -> [FaultCause] -> Cause

-- To find "All causes for a specific machine's fault", we need to join multiple tables.

-- QUERY: Get all Causes for 'Big Drill' (machine_id: 1) having 'Overheating' (fault_id: 'F1')
-- (Note: In SQL we usually rely on IDs, but we can join heavily to filter by text)

SELECT 
    troubleshooting_products.name as Machine,
    fault_library.name as Fault,
    cause_library.name as PossibleCause,
    fault_causes.justification as Justification
FROM fault_causes
-- 1. Join up to the Cause Library to get the Cause Name
JOIN cause_library ON fault_causes.cause_id = cause_library.id
-- 2. Join back to the Product-Fault Link
JOIN product_faults ON fault_causes.product_fault_id = product_faults.id
-- 3. Join to Fault Library to get Fault Name
JOIN fault_library ON product_faults.fault_id = fault_library.id
-- 4. Join to Product to get Machine Name
JOIN troubleshooting_products ON product_faults.product_id = troubleshooting_products.id

WHERE troubleshooting_products.name LIKE '%Drill%';

-- THIS IS THE "MASTER QUERY" of your Troubleshooting feature.
-- It connects ALL 5 tables together.

-- ==========================================
-- YOUR TURN:
-- Try to modify the query above to only show causes where the 
-- 'justification' is NOT NULL (i.e., it has a specific note).
-- Hint: Add "AND ..." to the WHERE clause.
-- ==========================================


-- ==========================================
-- BONUS LEVEL 2 CHALLENGE:
-- You mastered the Product <-> Fault link.
-- Now try the Fault <-> Cause link.

-- Goal: Join 'fault_causes' with 'cause_library'.
-- Show:
--   1. The 'name' of the Cause (from cause_library)
--   2. The 'justification' (from fault_causes)
-- Condition: Only show rows where 'justification' is NOT NULL.

-- Hint: JOIN cause_library ON fault_causes.cause_id = ???
-- ==========================================
-- ANSWER TO BONUS CHALLENGE:
SELECT 
    cause_library.name, 
    fault_causes.justification 
FROM fault_causes
JOIN cause_library 
    ON fault_causes.cause_id = cause_library.id
WHERE fault_causes.justification IS NOT NULL;  -- Correct way to check for NULL

-- KEY CORRECTIONS:
-- 1. Use "ON" for joins: JOIN table ON condition
-- 2. Use "IS NOT NULL" (not != Null). In SQL, NULL is special!


-- ==========================================
-- LEVEL 4: THE ANALYST (AGGREGATION)
-- ==========================================

-- Now let's do some math.
-- Key words: COUNT(), GROUP BY, ORDER BY

-- 1. COUNTING
-- "How many machines do we have?"
SELECT COUNT(*) FROM troubleshooting_products;

-- 2. GROUPING
-- "How many faults does EACH machine have?"
SELECT 
    product_id, 
    COUNT(*) as TotalFaults
FROM product_faults
GROUP BY product_id;

-- 3. HUMAN READABLE REPORT
-- Combine JOIN (Level 2) with GROUP (Level 4)
-- "Show me Machine Names and their Fault Counts, ordered by most faults."

SELECT 
    troubleshooting_products.name, 
    COUNT(product_faults.id) as FaultCount
FROM product_faults
JOIN troubleshooting_products 
    ON product_faults.product_id = troubleshooting_products.id
GROUP BY troubleshooting_products.name
ORDER BY FaultCount DESC;


-- ==========================================
-- FINAL BOSS CHALLENGE:
-- Find the "Most Common Cause" across the entire system.
-- 1. Count rows in 'fault_causes'
-- 2. Group by 'cause_id'
-- 3. Join 'cause_library' to get the name
-- 4. Order by the count descending (DESC)
-- ==========================================
 