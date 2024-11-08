/**
 * Create Analysis API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/data/create_analysis',
    auth: true,

    handle: async (c) => {
        const body = await c.req.json();

        if('prompt' in body) {

            // Get logged in user from auth token
            const tokenData = c.get('auth_user');

            try {
                // Analyze user input
                const analysis = await api.llm.analyzeUserInput(body.prompt);
        
                // Register analysis to database
                await api.data.addUserAnalysis(tokenData.id, body.prompt, analysis);

                // Return the analysis
                c.status(200);
                return c.json(analysis);
            } catch(e) {
                c.status(e.status);
                return c.json({
                    message: e.message,
                    code: e.code
                });
            }

        } else {
            c.status(400);
            return c.json({
                message: 'Malformed request'
            });
        }
    }

};