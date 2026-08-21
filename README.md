# Al Kareem Excellence Platform

Project: Full-Stack Competition & Evaluation Portal for "Al Kareem International Foundation"
Tech Stack: React, Vite, Tailwind CSS, Vercel (for deployment), and Supabase (Auth, Database, Storage).

CONTEXT & BRANDING:
I am uploading the official logo of the foundation. Extract the exact Hex/RGB color codes from this logo.
- Primary Color: Dark Green (Islamic/Institutional theme)
- Accent Color: Golden/Yellow (Symbolizing victory/medals; use for primary buttons, highlights, and icons)
- Background Color: Off-White / Pure White
- Typography & Terminology: 
  1. The foundation's exact name is "Al Kareem International Foundation". Use this exact spelling everywhere.
  2. STRICT REQUIREMENT: Universally use the term "Registration Number" (রেজিস্ট্রেশন নাম্বার) for all user identification and certificate generation. DO NOT use the term "Roll Number" anywhere in the system.

Please build the application with the following 5 Core Modules. Implement the frontend UI and the corresponding Supabase backend logic/schema.

MODULE 1: FRONTEND & HOME PAGE (Mobile-First UI)
- Header: Logo on top-left (with text "Al Kareem International Foundation"). Centered Navigation (Home, Ongoing Events, Results, Leaderboard, Rules). Right-aligned Golden "Register / Login" button.
- Hero Section: A large, visually appealing banner featuring the Bengali tagline: "মেধা ও মননের লড়াইয়ে আপনাকে স্বাগতম!". Place a dynamic "Countdown Timer" below the text showing time left for the next upcoming event.
- Competitions Grid: Cards displaying active/upcoming competitions (e.g., "Ramadan Quiz", "Hifzul Quran"). Show title, type (MCQ/Written), category, and a "Participate" CTA button.
- Wall of Fame (Leaderboard): A section showcasing top winners of recent competitions with small avatar placeholders, names, and scores.
- Verification Zone: A simple input field on the homepage to enter a Certificate Code/Registration Number to instantly verify authenticity.
- Footer: Logo, Email (info.alkareemif@gmail.com), Dummy Helpline, Quick Links (Privacy Policy, FAQ), Social Icons, and "Visit Our Main Foundation Website" cross-link.

MODULE 2: USER AUTHENTICATION & REGISTRATION (Supabase Auth)
- Roles (RBAC): Super Admin, Competition Admin, Evaluator, Competitor, Guest.
- Registration Form:
  - Identity: Full Name (Bangla & English), Father's Name, Date of Birth, Profile Photo upload.
  - Category: Dropdown for "Member" or "General". If "Member" is selected, show an input field for "Membership ID" (for later verification against the foundation database).
  - Contact & Address: Mobile (with OTP logic placeholder), Email, Address (Division -> District -> Upazila cascading dropdowns), Institution Name.
  - Automation: Upon successful submission, generate a unique "Registration Number" (e.g., FDN-2026-QZ-000123) and save it to the user's profile.

MODULE 3: ADMIN DASHBOARD & EXAM BUILDER
- Dashboard Overview: Stats for Total Registrations, Active Competitions, Pending Evaluations.
- Competition Builder: Create new competitions with Title, Type (MCQ, Short Question, Written, or Mixed), Category, Reg. Start/End Date, Exam Window Date/Time, Duration (minutes), and a toggle for "Negative Marking".
- Question Bank: 
  - For MCQ: Input question, 4 options, mark the correct answer, assign marks.
  - For Written/Short: Input question, max marks, and optional word limit.

MODULE 4: EXAM ENGINE & EVALUATION PANEL
- Exam Session: When a user starts, lock the attempt (only 1 attempt allowed). Display a live countdown timer. Implement auto-save for answers per question. Auto-submit when the timer ends.
- Auto-Scoring (MCQ): Instantly calculate scores based on the correct answers in the database. Apply negative marking if toggled on.
- Evaluation Panel (Written): Send written answers to a "Pending Review" queue. Users with the 'Evaluator' role can view assigned answers, input manual marks, and add comments. 
- Result Processing: Total Score = MCQ Auto-Score + Manual Evaluated Score. Keep results as "Draft" until the Admin clicks "Publish Results", which triggers a notification and updates the public Leaderboard.

MODULE 5: DYNAMIC CERTIFICATE STUDIO & VERIFICATION
- Template Designer (Admin): Upload a background image. Provide a drag-and-drop interface to place dynamic text fields over the image (e.g., {{Name}}, {{Registration Number}}, {{Competition Name}}, {{Score}}, {{Rank}}). 
- PDF Generation: When results are published, automatically generate PDFs merging user data with the template. Include the Foundation's Logo at the top center. 
- QR & Verification: Generate a unique Verification Code and QR code for every certificate. 
- Public Verification Route (/verify): A page where scanning the QR or entering the code shows "✅ Authentic Certificate Issued by Al Kareem International Foundation" along with the participant's details.

Please initialize the project, set up the routing, build the database schema in standard SQL/Supabase format, and generate the UI components for these modules.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://al-kareem-champions.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/297871a8-eb6d-4f37-9d6a-72725cda814a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
