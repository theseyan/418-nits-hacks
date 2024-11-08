/**
 * API Server
*/

const Hono = require('hono').Hono;
const serve = require('@hono/node-server').serve;
const cors = require('hono/cors').cors;
const config = require('./config.json');
const apiRoutes = require('./api/Routes');
const database = require('./db');
const API = require('./api/api');

class APIServer {
    api = new Hono();

    async init() {
        // Use CORS
        this.api.use('*', cors({
            origin: [config.site.root, ...config.api.corsOrigins],
            allowMethods: ['POST', 'GET']
        }));

        // Setup routes
        apiRoutes.setup(this.api);

        // Connect to database
        await database.init();

        // Start the API server
        serve({
            fetch: this.api.fetch,
            port: config.api.port
        });
        console.log(`API server running on Port ${config.api.port}`);

        // await API.llm.analyzeUserInput("im feeling tired");
    }
};

// If script is run directly, start the server
// else export it.
if(require.main === module) {
    (new APIServer()).init();
}else {
    module.exports = new APIServer();
}