# Biyana Amount to Token Amount Migration Guide

## Summary
The field "Biyana Amount" has been changed to "Token Amount" throughout the application. The form itself is still called "Biyana Form" but the payment amount field is now "Token Amount".

## Changes Made

### 1. Database Changes
- **Schema**: Renamed `biyanaAmount` column to `tokenAmount` in the Biyana table
- **Migration File**: Created migration at `shadman-housing-backend/prisma/migrations/rename_biyana_to_token_amount/migration.sql`
- **Note**: The form is still called "Biyana Form" - only the amount field name changed

### 2. Backend Changes
- Updated all API routes (forms.js, voucher.js, transfer.js, report.js, inventory.js)
- Updated validator (forms.validator.js) to accept `tokenAmount` instead of `biyanaAmount`
- All backend code now uses `tokenAmount` field

### 3. Frontend Changes
- **i18n Translations**: Updated both English and Urdu translations
  - Form name: Still "Biyana Form" (بیعانہ فارم)
  - Payment type: "Token Payment" (ٹوکن ادائیگی)
  - Amount field: "Token Amount" (ٹوکن رقم)
  - Summary label: "Token" (ٹوکن)
- **Components Updated**:
  - BiyanaForm.tsx
  - PrintableBiyanaFormSimple.tsx
  - ViewBiyanaForms.tsx
  - RecordPayment.tsx
  - Vouchers.tsx

## Migration Steps

### Step 1: Run Database Migration
Navigate to the backend directory and run the migration:

```powershell
cd shadman-housing-backend
npx prisma migrate deploy
```

OR manually run the SQL migration:

```sql
ALTER TABLE "Biyana" RENAME COLUMN "biyanaAmount" TO "tokenAmount";
```

### Step 2: Generate Prisma Client
After running the migration, regenerate the Prisma client:

```powershell
npx prisma generate
```

### Step 3: Restart Backend Server
Stop and restart your backend server to apply the changes:

```powershell
# Stop the current server (Ctrl+C if running)
# Then start it again
npm start
# or
node server.js
```

### Step 4: Clear Frontend Cache
Clear your browser cache and restart the frontend:

```powershell
cd ..
npm run dev
```

## Testing Checklist

After migration, test the following:

- [ ] Create a new Token (Biyana) form
- [ ] View existing Token forms in ViewBiyanaForms page
- [ ] Record a Token payment in RecordPayment page
- [ ] Print a Token form - verify "Token Amount" appears correctly
- [ ] Check payment vouchers display "Token Payment" instead of "Biyana Payment"
- [ ] Verify Urdu translations show "ٹوکن" instead of "بیعانہ"
- [ ] Test approval workflow for Token forms
- [ ] Verify payment history calculations include token amounts correctly

## Important Notes

1. **No Data Loss**: The migration only renames the column. All existing data remains intact.

2. **Backwards Compatibility**: Old API clients must update to use `tokenAmount` field name.

3. **UI Labels**: All user-facing labels now show "Token" instead of "Biyana" in both English and Urdu.

4. **Database Field**: The actual database table column is now `tokenAmount`.

## Rollback (If Needed)

If you need to rollback this change:

```sql
ALTER TABLE "Biyana" RENAME COLUMN "tokenAmount" TO "biyanaAmount";
```

Then revert the code changes in your version control system.

## Files Modified

### Backend
- `prisma/schema.prisma`
- `prisma/migrations/rename_biyana_to_token_amount/migration.sql`
- `validators/forms.validator.js`
- `routes/forms.js`
- `routes/voucher.js`
- `routes/transfer.js`
- `routes/report.js`
- `routes/inventory.js`

### Frontend
- `src/i18n/config.ts` (English and Urdu translations)
- `src/pages/forms/BiyanaForm.tsx`
- `src/pages/forms/PrintableBiyanaFormSimple.tsx`
- `src/pages/submitted-forms/ViewBiyanaForms.tsx`
- `src/pages/payments/RecordPayment.tsx`
- `src/pages/Vouchers.tsx`

## Contact
If you encounter any issues during migration, please check:
1. Database migration ran successfully
2. Prisma client regenerated
3. Both backend and frontend servers restarted
4. Browser cache cleared
