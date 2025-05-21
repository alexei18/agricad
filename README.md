# AgriCad Platform

Platformă de Gestionare a Terenurilor Agricole (Agricultural Land Management Platform).

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Features](#features)
    - [Admin](#admin)
    - [Mayor](#mayor)
    - [Farmer](#farmer)
3.  [Architecture & Technology](#architecture--technology)
4.  [Folder Structure](#folder-structure)
5.  [Database Schema](#database-schema)
6.  [Local Setup Instructions](#local-setup-instructions)
7.  [Enabling Real Authentication](#enabling-real-authentication)

## Project Overview

AgriCad is a web-based platform designed to streamline the management of agricultural land data for administrators, mayors, and farmers in Moldova. It provides role-based access to visualize land parcels on a map, manage farmer information, assign parcel ownership and cultivation rights, and view relevant statistics.

The core functionalities include:

- **Centralized Data Management:** A single source of truth for parcel geometry, area, ownership, and cultivation status.
- **Role-Based Access Control:** Distinct dashboards and permissions for Administrators, Mayors (representing specific villages), and Farmers.
- **Interactive Map Visualization:** Displaying land parcels with color-coding based on farmer assignments.
- **Data Import:** Bulk import of basic parcel data (ID, area, geometry, village) via CSV by the Administrator.
- **Parcel Assignment:** Mayors can assign owners and cultivators to parcels within their village.
- **Reporting & Statistics:** Dashboards showing key metrics for each role (e.g., total area, farmer counts, parcel distribution).
- **User Management:** Admins manage mayor accounts; Mayors manage farmer accounts within their village.

## Features

### Admin

- **Global Dashboard:** Overview cards linking to key management sections.
- **Mayor Management:** Create, view, edit mayor accounts (name, email), manage subscription status (Active, Pending, Inactive), and delete mayors. Requires password for creation.
- **Parcel Upload:** Bulk upload parcel data (ID, area, projected coordinates, village) via CSV. Handles coordinate transformation from a local projection (defined in `src/app/admin/parcels/actions.ts`) to WGS84 for map display.
- **Farmer Viewing:** View a read-only list of all farmers across all villages, with filtering options.
- **Global Statistics:** View aggregated statistics across all villages (e.g., parcels/farmers per village, mayor status distribution).
- **System Settings:**
  - Modify site name (currently simulated).
  - Simulate Mayor/Farmer roles for testing.
  - Trigger system backup (simulated).
  - Clear application data (Farmers, Mayors, Parcels - **Use with extreme caution!**).
  - Clear system logs.
- **System Logs:** View logs for parcel assignments and user/system actions.
- **Tutorial:** Onboarding tour explaining the admin interface.

### Mayor

- **Village Dashboard:** Overview of village statistics (total parcels, area, farmers) and quick links.
- **Farmer Management:** Create, view, edit (name, code, email, phone, map color), and delete farmer accounts within their assigned village. Requires password for creation.
- **Parcel Management:**
  - View parcels within their village on an interactive map, color-coded by assigned owner.
  - Assign parcels to farmers (both owner and cultivator) using lists of cadastral codes.
  - Toggle option to assign cultivated parcels separately.
  - View a list of all parcels in the village with owner/cultivator details.
  - Click on map parcels to view dimensions.
- **Village Statistics:** View charts showing land distribution per farmer and parcel size distribution within their village.
- **Account Management:** View own account details and subscription status.
- **Support:** Access FAQ (placeholder) and contact information.
- **Tutorial:** Onboarding tour explaining the mayor interface.

### Farmer

- **Dashboard:** Overview of owned and cultivated land area, lists of owned/cultivated parcels, and village statistics comparison.
- **Parcel Map:** View owned and cultivated parcels on an interactive map.
- **Village Statistics:** View charts comparing their owned/cultivated area against the village average and the overall land distribution among farmers in their village.
- **Tutorial:** Onboarding tour explaining the farmer interface.

## Architecture & Technology

- **Framework:** Next.js 15+ with App Router (Server Components by default)
- **Language:** TypeScript
- **Database:** MySQL (managed via Prisma ORM)
- **Styling:** Tailwind CSS with ShadCN UI components
- **Mapping:** React Leaflet with OpenStreetMap tiles
- **Coordinate Transformation:** Proj4js (for handling local map projections during CSV import)
- **State Management:** React Hooks (useState, useEffect, useCallback) primarily; Context API for global state like Sidebar and Tour.
- **Forms:** React Hook Form with Zod for validation
- **Authentication:** Currently bypassed for testing; designed for credential-based login (bcrypt for password hashing).
- **Deployment:** Assumed Node.js environment (local setup uses `npm run dev`).

## Folder Structure

```
.
├── prisma/             # Prisma schema, migrations, and seed script
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/             # Static assets (if any)
├── src/
│   ├── app/            # Next.js App Router routes
│   │   ├── (dashboards)/ # Route groups for different roles
│   │   │   ├── admin/
│   │   │   ├── farmer/
│   │   │   └── mayor/
│   │   ├── api/        # API routes (if needed)
│   │   ├── layout.tsx  # Root layout
│   │   ├── page.tsx    # Landing/Bypass page
│   │   └── globals.css # Global styles & ShadCN theme variables
│   ├── components/     # Reusable UI components
│   │   ├── maps/       # Map-specific components (e.g., ParcelMap)
│   │   ├── tour/       # React Joyride tour steps and provider
│   │   └── ui/         # ShadCN UI components
│   ├── hooks/          # Custom React hooks (e.g., useToast, useMobile)
│   ├── lib/            # Utility functions and libraries
│   │   ├── prisma.ts   # Prisma client instance setup
│   │   ├── utils.ts    # General utilities (e.g., cn)
│   │   └── csv-utils.ts# CSV parsing logic
│   ├── services/       # Data fetching and mutation logic (interacts with Prisma)
│   │   ├── farmers.ts
│   │   ├── logs.ts
│   │   ├── mayors.ts
│   │   ├── parcels.ts
│   │   └── types.ts    # Shared TypeScript types for services
│   └── middleware.ts   # Next.js middleware (currently minimal)
├── .env                # Local environment variables (GITIGNORED!)
├── .env.example        # Example environment variables
├── components.json     # ShadCN UI configuration
├── next.config.ts      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── README.md           # This file
└── tsconfig.json       # TypeScript configuration
```

## Database Schema

(Defined in `prisma/schema.prisma`)

- **Mayor:** Stores mayor account details (name, village, email, hashed password, subscription status/end date). `village` is unique.
- **Farmer:** Stores farmer account details (name, company code, village, optional email/phone, hashed password, map color). `companyCode` and `email` are unique.
- **Parcel:** Stores land parcel data (string ID, village, area, WGS84 coordinates [JSON], optional `ownerId`, optional `cultivatorId`). Foreign keys link to `Farmer` for owner/cultivator (on delete: set null).
- **LogEntry:** Stores activity logs (timestamp, type, actor, action, details).
- **Status (Enum):** Defines possible mayor subscription statuses (`ACTIVE`, `INACTIVE`, `PENDING`).
- **LogType (Enum):** Defines log categories (`ASSIGNMENT`, `USER_ACTION`, `SYSTEM`).

## Local Setup Instructions

Follow these steps to set up and run the AgriCad application locally using XAMPP.

**Prerequisites:**

- **Node.js and npm:** Ensure you have Node.js (version 18 or later recommended) and npm installed. Download from [https://nodejs.org/](https://nodejs.org/)
- **XAMPP:** Install XAMPP, which includes Apache, MySQL (or MariaDB), and phpMyAdmin. Download from [https://www.apachefriends.org/](https://www.apachefriends.org/)
- **Git:** Ensure Git is installed for cloning the repository.

**Steps:**

1.  **Clone the Repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

    _(This might take a few minutes)_

3.  **Start XAMPP Services:**

    - Open the XAMPP Control Panel.
    - Start the **Apache** and **MySQL** services.

4.  **Create the Database:**

    - Open phpMyAdmin in your browser (usually accessible at `http://localhost/phpmyadmin`).
    - Click on the "Databases" tab.
    - In the "Create database" field, enter `AgriCad` (or your preferred database name).
    - Select `utf8mb4_unicode_ci` as the collation.
    - Click "Create".

5.  **Configure Environment Variables:**

    - **Create `.env` file:** Copy the `.env.example` file and rename the copy to `.env`.
      ```bash
      cp .env.example .env
      ```
    - **Open `.env`:** Edit the newly created `.env` file in a text editor.
    - **Update `DATABASE_URL`:** Modify the connection string to match your XAMPP MySQL setup.
      - **Default XAMPP (no root password):**
        ```
        DATABASE_URL="mysql://root:@localhost:3306/AgriCad"
        ```
      - **If you have set a password for the root user:**
        ```
        DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/AgriCad"
        ```
        (Replace `YOUR_MYSQL_PASSWORD` with your actual password and `AgriCad` if you used a different database name).
    - **Set `ADMIN_EMAIL` & `ADMIN_PASSWORD`:** Define the desired credentials for the initial admin user. These will be used by the seed script.
      ```
      ADMIN_EMAIL="admin@AgriCad.example.com"
      ADMIN_PASSWORD="password123" # CHANGE THIS to a strong password!
      ```
    - **(Optional) `GOOGLE_GENAI_API_KEY`:** Add if using Genkit features (currently none implemented).

6.  **Apply Database Migrations:**

    - This command creates the database tables based on `prisma/schema.prisma`.
    - Run in your project terminal:
      ```bash
      npx prisma migrate dev --name init
      ```
    - Prisma might ask to reset the database if it already exists. Confirm if you are sure (this deletes existing data if run again later).

7.  **Seed Initial Data (Admin, Example Mayor/Farmer):**

    - This runs the `prisma/seed.ts` script to create the default admin user (using credentials from `.env`) and example mayor/farmer accounts for testing.
    - Run:
      ```bash
      npm run seed
      ```
    - _Note:_ You can modify `prisma/seed.ts` to change example data or add more.

8.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    - This starts the Next.js development server, typically on `http://localhost:9002`.

9.  **Access the Application:**
    - Open your web browser and navigate to `http://localhost:9002`.
    - You should see the **role selection page** (because login is currently bypassed).

**Important Notes for Local Testing:**

- **Bypassed Login:** Authentication is currently bypassed via `src/app/page.tsx`. You can directly access the dashboards using the links on this page.
- **Hardcoded IDs in Bypassed Mode:** When login is bypassed, the Mayor and Farmer dashboards use hardcoded IDs (`mayor1`, `farmer1`) defined in their respective `layout.tsx` files (`src/app/mayor/dashboard/layout.tsx`, `src/app/farmer/dashboard/layout.tsx`). The `seed.ts` script creates users with these IDs. If you change these IDs in the code, ensure corresponding users exist in the database.
- **CSV Upload Projection:** The CSV upload feature (`/admin/parcels`) expects projected coordinates. The transformation logic is in `src/app/admin/parcels/actions.ts`. Ensure your test CSV data uses the coordinate system defined there (`MOLDOVA_LOCAL_TM_GRS80`) or update the `proj4.defs` definition if your data uses a different system. The required columns are `parcel_id`, `area_hectares`, `projected_polygon`, `village`.

## Enabling Real Authentication

The application is set up with bypassed login for easier development and testing. To enable the actual login system:

1.  **Remove Bypass Page:** Delete or rename the current `src/app/page.tsx` file (which contains the role selection links).
2.  **Create Login Page:** Create a new `src/app/page.tsx` (or `src/app/login/page.tsx` and adjust routing) that contains the actual `LoginForm` component. You can adapt the code from the deleted `src/app/login/page.tsx`.
3.  **Implement Authentication Logic:**
    - Modify the `login` server action (likely in `src/app/login/actions.ts` or a similar auth file) to:
      - Verify user credentials (email/password) against the database (using `prisma` and `bcrypt.compare`).
      - Implement session management (e.g., using JWT, next-auth, or another library). This part is **not yet implemented** and would require adding session handling logic.
      - Redirect users to their respective dashboards upon successful login based on their role (Admin, Mayor, Farmer).
4.  **Protect Routes:** Implement middleware (`middleware.ts`) or logic within layouts/pages to check for valid sessions and redirect unauthenticated users to the login page. The current `middleware.ts` is a no-op and needs to be updated for authentication checks.
5.  **Update Layouts:** Modify the dashboard layouts (`admin/dashboard/layout.tsx`, `mayor/dashboard/layout.tsx`, `farmer/dashboard/layout.tsx`) to fetch the _actual_ logged-in user's ID and data instead of using the hardcoded IDs (`mayor1`, `farmer1`). This usually involves accessing session data.
6.  **Implement Logout:** Add actual logout functionality (e.g., clearing the session) to the logout buttons in the sidebars.

**Note:** Enabling authentication requires significant additions, particularly for session management and route protection, which are currently not built into the project.

# Ideii nume

- Agri Tech Vision
- Agri Par Tech
- E Agro
- Agro Tech Vision
-



# Database seed
 npx prisma migrate reset
 npx prisma migrate dev --name <nume>