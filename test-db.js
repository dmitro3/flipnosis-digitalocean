const DatabaseService = require('./server/services/database-postgresql.js');

async function testDatabase() {
  const db = new DatabaseService();
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    const connected = await db.initialize();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Check tables
    const tablesResult = await db.pgPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in PostgreSQL database:');
    tablesResult.rows.forEach(row => console.log('- ' + row.table_name));
    
    // Check games table structure
    const columnsResult = await db.pgPool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'games' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n🎮 Columns in games table:');
    columnsResult.rows.forEach(row => 
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    );
    
    await db.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Error details:', error);
  }
}

testDatabase();
