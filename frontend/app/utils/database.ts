import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('archive.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'موظف',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_type TEXT NOT NULL,
        file_data TEXT NOT NULL,
        category TEXT,
        owner_name TEXT,
        land_type TEXT,
        location TEXT,
        extracted_text TEXT,
        summary TEXT,
        auto_category TEXT,
        keywords TEXT,
        notes TEXT,
        uploaded_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
      CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(auto_category);
      CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// User operations
export const createUser = async (user: any) => {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO users (id, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.username, user.password, user.full_name, user.role]
  );
  return result;
};

export const findUserByUsername = async (username: string) => {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return result;
};

export const getAllUsers = async () => {
  const db = getDatabase();
  const results = await db.getAllAsync('SELECT * FROM users');
  return results;
};

// Document operations
export const createDocument = async (document: any) => {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO documents (
      id, title, description, file_type, file_data, category,
      owner_name, land_type, location, extracted_text, summary,
      auto_category, keywords, notes, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      document.id,
      document.title,
      document.description || '',
      document.file_type,
      document.file_data,
      document.category || '',
      document.owner_name || '',
      document.land_type || '',
      document.location || '',
      document.extracted_text || '',
      document.summary || '',
      document.auto_category || '',
      document.keywords || '',
      document.notes || '',
      document.uploaded_by,
    ]
  );
  return result;
};

export const getAllDocuments = async (filters?: any) => {
  const db = getDatabase();
  let query = 'SELECT * FROM documents WHERE 1=1';
  const params: any[] = [];

  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.land_type) {
    query += ' AND land_type = ?';
    params.push(filters.land_type);
  }

  query += ' ORDER BY created_at DESC';
  
  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const results = await db.getAllAsync(query, params);
  return results;
};

export const getDocumentById = async (id: string) => {
  const db = getDatabase();
  const result = await db.getFirstAsync(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );
  return result;
};

export const updateDocument = async (id: string, updates: any) => {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  
  const result = await db.runAsync(
    `UPDATE documents SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );
  return result;
};

export const deleteDocument = async (id: string) => {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
  return result;
};

export const searchDocuments = async (query: string, filters?: any) => {
  const db = getDatabase();
  let sql = `
    SELECT * FROM documents 
    WHERE (
      title LIKE ? OR
      description LIKE ? OR
      extracted_text LIKE ? OR
      owner_name LIKE ? OR
      location LIKE ? OR
      keywords LIKE ?
    )
  `;
  
  const searchPattern = `%${query}%`;
  const params = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];

  if (filters?.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.land_type) {
    sql += ' AND land_type = ?';
    params.push(filters.land_type);
  }

  sql += ' ORDER BY created_at DESC LIMIT 100';

  const results = await db.getAllAsync(sql, params);
  return results;
};

export const getStatistics = async () => {
  const db = getDatabase();
  
  const totalDocs = await db.getFirstAsync('SELECT COUNT(*) as count FROM documents');
  const totalUsers = await db.getFirstAsync('SELECT COUNT(*) as count FROM users');
  const byCategory = await db.getAllAsync(`
    SELECT auto_category, COUNT(*) as count 
    FROM documents 
    WHERE auto_category IS NOT NULL AND auto_category != ''
    GROUP BY auto_category
  `);
  const recentDocs = await db.getAllAsync(
    'SELECT id, title, created_at FROM documents ORDER BY created_at DESC LIMIT 5'
  );

  return {
    total_documents: (totalDocs as any)?.count || 0,
    total_users: (totalUsers as any)?.count || 0,
    by_category: byCategory,
    recent_documents: recentDocs,
  };
};
