# CommuniLink issue workflow check

Use three signed-in accounts with registered profiles: one Citizen, one NGO, and
one Volunteer. The volunteer must have a profile in MongoDB before NGO assignment.
Use a volunteer location within 15 km of the issue if testing Available Tasks with
location filtering. Keep the three browser sessions separate.

1. As Citizen, report an issue with a title, description, category, map location,
   and image. Confirm it appears in My Issues as `pending`.
2. As NGO, confirm the issue appears in Incoming Issues without requiring the NGO
   profile to have a location. Confirm the NGO receives a new-issue notification.
   Approve it, or select a volunteer in Incoming Issues and choose Assign (which
   approves the pending issue before assigning it).
3. Confirm the issue is `assigned`, the volunteer is shown by name, and the Citizen
   and assigned Volunteer receive notifications. Confirm the issue appears in the
   Volunteer’s My Tasks. An unassigned `approved` issue should be visible in
   Available Tasks (within 15 km when a volunteer location is set).
4. As Volunteer, accept an available task if it was not assigned by the NGO.
   Upload a JPG, PNG, or WebP completion proof (5 MB maximum) and submit it.
   Confirm it becomes `completed`, the proof is attached, and the Citizen and NGO
   receive completion notifications.
5. As NGO, verify the completed task from Task Management, Live Tracking,
   Issue Verification, or the completion notification. Confirm it becomes
   `verified`, the Citizen and Volunteer are notified, and the Volunteer receives
   the verification points.
6. Confirm the Citizen, NGO dashboard, Volunteer task lists, maps, and NGO
   analytics reflect the same status after polling (within 10 seconds); switching
   back to a visible tab should refresh immediately.
7. Negative checks: a non-NGO cannot approve, assign, or verify; a different
   volunteer cannot complete another volunteer’s issue; completion without proof
   is rejected; and an invalid lifecycle transition returns a clear 400 response.
   Confirm `GET /api/notifications` only returns the signed-in user’s notifications.
