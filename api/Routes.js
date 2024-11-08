/**
 * Routes registrar
 * Adds all API endpoints and registers authentication middleware
*/

const fs = require('fs');
const API = require('./api');

module.exports = new class APIRoutes {

    /**
     * Sets up API endpoints
    */
    setup(api) {

        // Load all endpoints
        const endpoints = fs.readdirSync('./api/endpoints').filter(file => file.endsWith('.js'));
        for (const file of endpoints) {
            const endpoint = require(`./endpoints/${file}`);

            // Register the API endpoint
            api[endpoint.type](endpoint.route, async (c) => {
                if(!'auth' in endpoint || endpoint.auth === true) {
                    let token = c.req.header('Authorization');

                    // Check if token is present
                    if(!token) {
                        c.status(401);
                        return c.json({
                            message: "Access token missing or invalid"
                        });
                    }else {
                        token = token.split(" ")[1];
                    }

                    try {
                        const data = await API.accounts.auth.verifyAccessToken(token);

                        // Set user data in context to be accessed later
                        c.set(`auth_user`, data);
                    } catch(e) {
                        c.status(401);
                        return c.json({
                            message: "Access token missing or invalid"
                        });
                    }
                } else {
                    c.set(`auth_user`, null);
                }

                return await endpoint.handle(c);
            });
        }

        console.log(`Loaded ${endpoints.length} API endpoints`);

    }

};