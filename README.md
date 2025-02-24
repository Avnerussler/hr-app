# Project Setup Guide

## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (for the frontend and server)
- [Docker](https://www.docker.com/) (for the MongoDB and Minio)

---

## Running the Application

### Frontend

1. Navigate to the frontend directory:

   ```sh
   cd frontend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

The frontend should now be running locally.

### Server

1. Navigate to the server directory:

   ```sh
   cd server
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

The server should now be running at `http://localhost:3001`.

### Database and Storage Services

1. Ensure Docker is running.
2. Start MongoDB and Minio using Docker Compose:

   ```sh
   docker compose up OR cd server npm run docker:compose
   ```

MongoDB and Minio should now be running.

- Minio is accessible at `http://localhost:9001`.
- Default Minio credentials:
  - **Username:** `admin`
  - **Password:** `password123`

---

## Additional Information

- The frontend will typically run on `http://localhost:5173`.
- The database and storage services, including MongoDB and Minio, should be accessible via their respective endpoints.
- The server should now be running and accessible.
- If you encounter issues, ensure that all dependencies are installed and Docker is running correctly.

Happy coding!
