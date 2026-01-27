import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', 
  password: 'postgres',
  port: 5433, // <--- CHANGE THIS FROM 5432 TO 5433
});

pool.on('connect', () => {
  // Update this message so you KNOW when you are on the right DB
  console.log('✅ Connected to Docker Postgres (Port 5433)'); 
});