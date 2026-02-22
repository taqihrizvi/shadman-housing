---
description: Verify the "Make Available" feature in Sold Inventory
---

1. Login as an Admin user (or use a browser session with admin privileges).
2. Navigate to the "Sold Inventory" page.
3. Identify a 'SOLD' plot that is NOT 'TRANSFERRED'.
4. Confirm the presence of the "Make Available" (arrow-right-left icon) button in the actions column for that plot.
5. Click the "Make Available" button.
6. Verify that a confirmation dialog appears with a warning message.
7. Confirm the action in the dialog.
8. Verify the success toast message appears.
9. Verify the plot is no longer in the "Sold Inventory" list (or status changed if filtering allows).
10. Navigate to "Inventory" (Unsold) page and verify the plot is listed there with status 'AVAILABLE'.
11. (Optional) Check backend database to ensure related forms (SaleAgreement, Biyana) are archived.
