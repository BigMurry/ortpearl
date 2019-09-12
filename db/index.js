const mongoose = require('mongoose');
const requireDir = require('require-dir');
const schemas = requireDir('./schema');

let connection;
const Models = {};
const DB_NAME = 'watch-tower';

async function getModel(dbUrl, dbName = DB_NAME) {
  if (!connection || connection.readyState !== 1) {
    connection = await mongoose.createConnection(
      dbUrl,
      {
        dbName,
        autoIndex: false,
        poolSize: 10,
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
    const schemaNames = Object.keys(schemas);
    for (let i = 0; i < schemaNames.length; ++i) {
      const name = schemaNames[i];
      Models[name] = connection.model(name, schemas[name]);
      Models[name].createIndexes();
    }
    Models['DB_CONNECTION'] = connection;
  }
  return Models;
}

module.exports = {
  getModel
};
