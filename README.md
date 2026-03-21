# Jobix

Full-stack job board platform built with Laravel and React.

Jobix helps:
- job seekers discover roles, save jobs, apply, and manage their profile
- companies publish jobs, review applicants, and manage hiring workflows
- admins monitor platform activity and manage users and job listings

## Live Demo

- Frontend: [https://jobix-two.vercel.app](https://jobix-two.vercel.app)
- API: [https://jobix.onrender.com](https://jobix.onrender.com)

## Highlights

- Authentication with email verification
- Forgot-password and reset-password flows
- Job search, filters, and saved jobs
- Job applications with resume upload
- Public user profiles
- Company dashboard for posting jobs and reviewing applicants
- Admin dashboard with platform stats and moderation actions
- Cloud file storage for resumes, avatars, and company logos

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Query
- Backend: Laravel 10, PHP
- Database: PostgreSQL
- Hosting: Vercel (frontend), Render (backend)
- Database hosting: Neon
- File storage: Cloudflare R2
- Email delivery: Brevo API

## Project Structure

```text
Jobix/
|- job-board-client/   # React frontend
|- job-board-api/      # Laravel API
```

## Core Features

### Job Seekers

- Register, verify email, log in, and reset password
- Browse jobs with filters
- Save jobs for later
- Apply with resume upload
- Manage profile, avatar, and resume
- Share a public profile

### Companies

- Create and manage company profile
- Post, edit, activate, and remove job listings
- Review applicants
- Download authorized resumes

### Admin

- View dashboard statistics
- Manage users
- Manage jobs and moderation actions

## Deployment Architecture

- React frontend deployed on Vercel
- Laravel API deployed on Render
- PostgreSQL hosted on Neon
- Uploads stored in Cloudflare R2
- Transactional email sent with Brevo

## Run Locally

### 1. Backend

```bash
cd job-board-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Frontend

```bash
cd job-board-client
npm install
```

Create `job-board-client/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Then run:

```bash
npm run dev
```

## Why This Project Matters

Jobix is a production-style full-stack application that brings together:
- frontend UI and state management
- backend API design and validation
- authentication and recovery flows
- cloud database deployment
- object storage integration
- email delivery integration

It was built as a portfolio project to demonstrate practical full-stack engineering skills across product, backend, frontend, and deployment work.

## Notes

- Because the backend runs on Render free hosting, the first request after inactivity may be slower while the service wakes up.
- Some repository-local files such as `node_modules`, build output, logs, and private env files should stay out of Git commits.
