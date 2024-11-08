/**
 * Database connection and pooling manager
*/

const config = require('./config.json');
const {Surreal} = require('surrealdb');
const {InternalServerError} = require('./api/Errors');

module.exports = new class Database {

    // Initialize new instance
    db = new Surreal();

    async init () {
        try {
            // Connect to the database
            await this.db.connect(config.database.host, {
                auth: {
                    username: config.database.user,
                    password: config.database.password
                },
                namespace: config.database.namespace,
                database: config.database.db
            });

            // Signin
            // await this.db.signin({
            //     username: config.database.user,
            //     password: config.database.password
            // });
            
            // await this.db.use({
            //     namespace: config.database.namespace,
            //     database: config.database.db
            // });
    
            console.log(`SurrealDB connected to ${config.database.host}`);

            return this.db;
        } catch (e) {
            throw new InternalServerError('Could not connect to SurrealDB: ' + e);
        }
    }

};