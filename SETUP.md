# CampusConnect - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Rust** (latest stable version)
   - Install from: https://rustup.rs/
   - Run: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Or on Windows, download the installer

3. **MongoDB** (v4.4 or higher)
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud version)

4. **Angular CLI**
   - Install globally: `npm install -g @angular/cli`

## Installation Steps

### 1. Start MongoDB

Open a terminal and start MongoDB:

```bash
mongod
```

MongoDB should now be running on `mongodb://localhost:27017`

### 2. Setup and Run Backend Services

Each service needs to be run in a separate terminal window.

#### Auth Service (Port 8080)

```bash
cd auth-service
cargo run
```

#### Academics Service (Port 8081)

```bash
cd academics-service
cargo run
```

#### Finance Service (Port 8082)

```bash
cd finance-service
cargo run
```

#### Hostel Service (Port 8083)

```bash
cd hostel-service
cargo run
```

#### Library Service (Port 8084)

```bash
cd library-service
cargo run
```

#### HR Service (Port 8085)

```bash
cd hr-service
cargo run
```

**Note:** The first time you run each service, Rust will download and compile dependencies. This may take several minutes.

### 3. Setup and Run Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will be available at: `http://localhost:4200`

## Verify Installation

1. Open browser and navigate to `http://localhost:4200`
2. You should see the CampusConnect login page
3. Click "Register here" to create a new account
4. Fill in the registration form:
   - Username: testuser
   - Password: password123
   - Full Name: Test User
   - Email: test@campus.edu
   - Role: admin
   - Campus: CAMPUS_A
5. Click "Register"
6. Login with your credentials
7. You should now see the dashboard

## Troubleshooting

### MongoDB Connection Issues

If you see "Failed to connect to MongoDB":
- Ensure MongoDB is running
- Check if port 27017 is available
- Update the MONGODB_URI in each service's `.env` file if needed

### Port Already in Use

If you see "Address already in use":
- Check if another service is using the port
- Kill the process: `lsof -ti:PORT | xargs kill` (Mac/Linux)
- Or change the PORT in the service's `.env` file

### Cargo Build Errors

If you encounter Rust compilation errors:
- Update Rust: `rustup update`
- Clean and rebuild: `cargo clean && cargo build`

### Angular Errors

If you see Angular errors:
- Delete node_modules: `rm -rf node_modules`
- Clear npm cache: `npm cache clean --force`
- Reinstall: `npm install`

## Default Configuration

Each service has a `.env` file with default configuration:

```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=campusconnect
JWT_SECRET=your-secret-key-change-in-production
PORT=808X  # Different for each service
```

**Important:** Change the JWT_SECRET in production!

## Service Ports

- Auth Service: 8080
- Academics Service: 8081
- Finance Service: 8082
- Hostel Service: 8083
- Library Service: 8084
- HR Service: 8085
- Frontend: 4200

## Next Steps

1. Explore the dashboard
2. Test each module
3. Check ARCHITECTURE.md for system design details
4. Read API.md for API documentation
