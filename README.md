# Transport ERP

## Run locally with SQL Server

1. In SQL Server Management Studio, create (or select) a database named `transport`.
2. Open and execute `db/transport_db.sql` against that database. It is safe to run on an existing project database: it creates missing tables and adds the columns required by the API.
3. Copy `backend/.env.example` to `backend/.env`, then set the SQL Server host, port, user, and password.
4. In one terminal:

   ```powershell
   cd backend
   py -m pip install -r requirements.txt
   py -m uvicorn main:app --reload --port 8000
   ```

5. In a second terminal at the project root:

   ```powershell
   npm install
   npm run dev
   ```

Open the Vite URL (normally `http://localhost:5173`). The API is served at `http://localhost:8000` and its interactive checks are at `/docs`.
