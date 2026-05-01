const Datastore = require('nedb-promises');
const path = require('path');

const dbDir = process.env.DB_DIR || path.join(__dirname, '../data');

const db = {
  users: Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true }),
  projects: Datastore.create({ filename: path.join(dbDir, 'projects.db'), autoload: true }),
  tasks: Datastore.create({ filename: path.join(dbDir, 'tasks.db'), autoload: true }),
  members: Datastore.create({ filename: path.join(dbDir, 'members.db'), autoload: true }),
};

// Create indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.projects.ensureIndex({ fieldName: 'createdAt' });
db.tasks.ensureIndex({ fieldName: 'projectId' });
db.members.ensureIndex({ fieldName: 'projectId' });

module.exports = db;
