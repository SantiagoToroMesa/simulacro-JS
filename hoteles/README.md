[Versión en Español](./README_paso_a_paso.md)

# Course and Registration System SPA

A Single Page Application (SPA) for user and course management, featuring role-based access (admin/user), dynamic navigation, and CRUD operations. Built with HTML, CSS, Vanilla JavaScript, and json-server for mock backend.

## Project Development Pie Chart

```mermaid
pie
    "Planning" : 10
    "Project Initialization (npm, Vite)" : 15
    "Folder and File Structure" : 15
    "Component and Service Development" : 25
    "Styles and UI" : 10
    "Integration and Testing" : 15
    "Documentation and Deployment" : 10
```

## How to Create a SPA from Scratch with Vite (Step by Step)

1. **Install Vite globally (optional):**
   ```bash
   npm install -g vite
   ```
2. **Create a new project folder and initialize npm:**
   ```bash
   mkdir my-spa-project
   cd my-spa-project
   npm init -y
   ```
3. **Install Vite as a dev dependency:**
   ```bash
   npm install vite --save-dev
   ```
4. **Add a dev script to your `package.json`:**
   ```json
   "scripts": {
     "dev": "vite"
   }
   ```
5. **Create your project structure:**
   - `index.html` (entry point)
   - `src/` (source code: JS, CSS, components, etc.)
6. **Start the development server:**
   ```bash
   npm run dev
   ```
7. **Open the local server URL (usually http://localhost:5173) in your browser.**

---

## Features
- User authentication (login/register)
- Role-based access: admin and user
- Dynamic sidebar and header
- Protected routes for admin and users
- CRUD operations for users and courses (admin only)
- Course enrollment for users
- Responsive and modern UI

## Project Structure
```
Simulacro_js/
├── db.json                # Mock database for json-server
├── index.html             # Main HTML entry point
├── package.json           # Project dependencies
├── src/
│   ├── components/        # Header, sidebar, modal components
│   ├── pages/             # HTML partials for dashboard, login, register, public
│   ├── services/          # API, auth, course, enrollment, user logic
│   ├── style/             # CSS styles
│   └── utils/             # Storage and validation utilities
└── ...
```

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/SantiagoToroMesa/simulacro-JS.git
   cd simulacro-JS
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the mock backend:
   ```bash
   npx json-server --watch db.json --port 3000
   ```
4. Open `index.html` in your browser or use a local server (e.g. Live Server extension).

## Usage
- **Login/Register:** Access via `/` or `/register`.
- **Dashboard:** Admin-only, manage users and courses.
- **Courses/Public:** Users can view and enroll in courses.
- **Sidebar/Header:** Dynamic based on user role and authentication.

## Roles & Route Protection
- **Admin:** Full access to dashboard, user/course CRUD, view all enrollments.
- **User:** Can view/enroll in courses, see own enrollments.
- **Route protection** is enforced in `src/main.js`.

## Dependencies
- [json-server](https://github.com/typicode/json-server) (for mock API)
- [SweetAlert2](https://sweetalert2.github.io/) (for alerts)
- [Vite](https://vitejs.dev/) (for development server)

## Example Users
- Admin: `admin@admin.com` / `yourpassword`
- User: Register a new account

## License
MIT 