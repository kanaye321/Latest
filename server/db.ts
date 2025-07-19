import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found! Please create a PostgreSQL database.");
  console.error("📋 Steps to fix:");
  console.error("1. Go to Database tab in Replit");
  console.error("2. Click 'Create a database'");
  console.error("3. Select PostgreSQL");
  console.error("4. Restart the application");
  
  throw new Error("DATABASE_URL environment variable is required. Please set up PostgreSQL database through Replit's Database tab.");
}

console.log("🔗 Connecting to database:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
console.log("🔧 Connection details:", {
  host: process.env.DATABASE_URL?.match(/@([^:]+):/)?.[1] || 'unknown',
  port: process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || 'unknown',
  database: process.env.DATABASE_URL?.match(/\/([^?]+)/)?.[1] || 'unknown'
});

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 60000,
});

// Test connection on startup with explicit verification
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connected to PostgreSQL database');
    console.log('✅ Database connection verified - data will persist');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    console.error('⚠️ Falling back to in-memory storage - data will NOT persist');
    console.error('💡 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    return false;
  }
}

// Test connection immediately
testDatabaseConnection();

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export const db = drizzle(pool, { schema });
