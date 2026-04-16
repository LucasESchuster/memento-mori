-- Step 1: Add birthDate column (nullable temporarily)
ALTER TABLE "Subscription" ADD COLUMN "birthDate" DATE;

-- Step 2: Backfill from birthYear (January 1 of that year)
UPDATE "Subscription" SET "birthDate" = make_date("birthYear", 1, 1);

-- Step 3: Make NOT NULL
ALTER TABLE "Subscription" ALTER COLUMN "birthDate" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "Subscription" DROP COLUMN "birthYear";
