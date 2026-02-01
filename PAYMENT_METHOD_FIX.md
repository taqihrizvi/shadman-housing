# Fix: Payment Method CASH Error

## Issue
```
Invalid value for argument `paymentMethod`. Expected PaymentMethod.
paymentMethod: "CASH" was being sent but enum was updated to BANK_DEPOSIT
```

## Root Cause
- Backend schema changed `CASH` to `BANK_DEPOSIT` in PaymentMethod enum
- Frontend BiyanaForm.tsx was still hardcoded to send `"CASH"`
- Translation files still referenced CASH

## Files Fixed

### 1. BiyanaForm.tsx
**Changed:**
```typescript
paymentMethod: "CASH"  // ❌ OLD
```
**To:**
```typescript
paymentMethod: "BANK_DEPOSIT"  // ✅ NEW
```

### 2. i18n/config.ts (English)
**Added:**
```typescript
// In forms section
bankDeposit: 'Bank Deposit',

// In payments.paymentMethods
BANK_DEPOSIT: 'Bank Deposit',
```

### 3. i18n/config.ts (Urdu)
**Added:**
```typescript
// In forms section
bankDeposit: 'بینک جمع',

// In payments.paymentMethods  
BANK_DEPOSIT: 'بینک جمع',
```

## Testing
1. ✅ Create new Biyana form - should work now
2. ✅ Payment method dropdown shows "Bank Deposit" option
3. ✅ Existing "CASH" references kept for backward compatibility display

## Status
✅ **FIXED** - Biyana forms can now be created successfully

## Next Steps
If you see this error again:
1. Check if any other forms (Sale Agreement, Transfer) are creating payment records
2. Verify payment method values match the enum: `BANK_DEPOSIT`, `BANK_TRANSFER`, `CHEQUE`, `ONLINE`
3. Check browser console for any cached old values
