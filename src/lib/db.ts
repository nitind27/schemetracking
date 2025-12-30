import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Connection timeout settings to prevent ECONNRESET
  connectTimeout: 60000, // 60 seconds
  // Keep connections alive
  keepAliveInitialDelay: 300000, // 5 minutes
  // Enable multiple statements for better performance
  multipleStatements: false,
});

export default pool;
