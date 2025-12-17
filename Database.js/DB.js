import pg from 'pg';
const { Pool } = pg;


const pool = new Pool({
  user: 'postgres',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'tokenproje',
});


export default pool;


export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('DB Bağlantısı başarılı:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('DB Hatası:', err);
    throw err;
  }
};
