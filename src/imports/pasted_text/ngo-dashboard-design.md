Design a highly detailed, modern, and production-ready "NGO Dashboard" UI for a web application called "COMMUNI-LINK – Smart Resource Allocation Platform".

This dashboard is the central control system for NGOs to manage citizen-reported issues, assign volunteers, monitor progress, and analyze impact.

The design should feel like a real-world SaaS platform used by professional organizations, with strong emphasis on clarity, efficiency, and decision-making.

---

## OVERALL LAYOUT

Use a structured layout:

* Left sidebar navigation
* Top navbar
* Main content area

Sidebar should include:

* Dashboard (Overview)
* Incoming Issues
* Task Management
* Volunteers
* Live Tracking
* Analytics
* Notifications
* Settings

Top Navbar:

* App logo/name (COMMUNI-LINK)
* Global search bar (search issues, volunteers)
* Notification bell icon
* NGO profile avatar
* Logout option

Design style:

* Primary color: Blue (#3B82F6)
* Neutral background (white/light grey)
* Rounded cards and buttons
* Subtle shadows
* Clean typography (Inter or Roboto)
* Professional SaaS look

---

1. DASHBOARD OVERVIEW (COMMAND CENTER)

---

Display key metrics as cards:

* Total Issues Reported
* Pending Approval
* Active Tasks
* Completed Tasks

Include data visualizations:

* Line chart: Issues reported over time
* Pie chart: Issue categories distribution
* Bar chart: Urgency levels (High / Medium / Low)

Add:

* “Recent Activity” section showing latest actions
* “High Priority Alerts” section highlighting urgent issues

---

2. INCOMING ISSUES (CRITICAL SECTION)

---

Display all issues reported by citizens.

Each issue card should include:

* Title
* Category
* Location (with map icon)
* Uploaded images (thumbnail preview)
* Reported by (Citizen name + verification badge)
* Timestamp
* Urgency level (color-coded: red/yellow/green)

Actions:

* Accept Issue
* Reject Issue
* View Details

Advanced features:

* Tag duplicate/similar issues detected nearby
* Show “Multiple reports from same area” indicator

---

3. ISSUE DETAILS PAGE

---

When an issue is opened, display:

* Full description
* Image gallery (click to enlarge)
* Map/location preview
* Citizen details (name, verification status)

Include timeline:

* Reported → Reviewed → Assigned → Completed

Buttons:

* Accept Issue
* Reject Issue
* Convert to Task

---

4. TASK MANAGEMENT (CORE OPERATIONS)

---

Display all accepted issues as tasks.

Each task card should include:

* Title

* Category

* Location

* Status:

  * Not Assigned
  * Assigned
  * In Progress
  * Completed

* Assigned volunteer (if any)

* Last updated timestamp

Allow filtering:

* By status
* By urgency
* By location

---

5. VOLUNTEER MANAGEMENT

---

Display a list/grid of volunteers.

Each volunteer card:

* Name
* Skills (tags: Medical, Logistics, Teaching, etc.)
* Location / distance
* Availability (Full-time / Part-time / Weekend)
* Verification badge

Include filters:

* Skills
* Availability
* Distance/location

---

6. SMART TASK ASSIGNMENT (KEY FEATURE)

---

Inside task details:

Display:

* Suggested volunteers (AI-based or rule-based)

Show match indicators:

* Skill match %
* Distance
* Availability

Include:

* Dropdown/select volunteer
* Button: “Assign Volunteer”

After assignment:

* Update task status automatically

---

7. LIVE TRACKING (ADVANCED FEATURE)

---

Show real-time task progress:

Statuses:

* Task Started
* In Progress
* Completed

Optional:

* Progress bar
* Timeline updates
* Location tracking indicator (if enabled)

---

8. NOTIFICATIONS

---

Display notifications such as:

* New issue reported
* Issue accepted/rejected
* Volunteer accepted task
* Task completed

Each notification should include:

* Icon
* Message
* Timestamp

---

9. ANALYTICS DASHBOARD (HIGH IMPACT)

---

Include advanced insights:

* Issues resolved per month (line chart)
* Most common issue categories (pie chart)
* Area-wise issue heatmap (map visualization)
* Volunteer performance stats

---

10. SETTINGS (ENTERPRISE LEVEL)

---

Organize into sections:

A. Organization Profile:

* NGO Name
* Address
* Contact details
* Website

B. Team Management:

* Add/remove admins
* Role-based access control

C. Security:

* Change password
* Logout from all devices

D. Notifications:

* Email alerts
* App notifications

E. Verification:

* Show “Verified NGO ✅” badge
* Upload/review documents

---

## UX & INTERACTION DETAILS

* Color-code urgency:
  Red = High, Yellow = Medium, Green = Low
* Use icons for clarity
* Highlight active sidebar item
* Use modals for confirmations (Accept/Reject/Delete)
* Disable buttons until required inputs are filled
* Provide success/error feedback messages
* Smooth transitions between pages

---

## GOAL

The NGO dashboard should function as a powerful command center that enables organizations to efficiently:

* Review and validate community issues
* Assign the right volunteers
* Track progress in real time
* Analyze impact through data

The UI should feel scalable, trustworthy, and ready for real-world deployment.
