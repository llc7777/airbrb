1. Testing Framework:
   Used RTL + Vitest to verify that AirBrB’s main features work correctly from a real user perspective. Included both component tests and a full UI happy path test.

2. Component Tests:

   - NotificationSnackbar
     Ensures notifications render, auto-hide, and close correctly
     Tests: message + severity, manual close, auto-dismiss

   - ReviewDialog
     Validates review submission
     Tests: rating selection, comment field, submit, close button

   - NavigationBar
     Ensures correct navigation for logged-in and logged-out states
     Tests: conditional menus, routing, logout behavior

3. Happy Path Test:
   Full end-to-end scenario for an admin:
   Register
   Create listing
   Update title/thumbnail
   Publish
   Unpublish
   Guest books listing
   Logout
   Login again
   Uses two users (host + guest) to simulate real booking behavior.
