/**
 * Create Analysis by Voice API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/data/create_analysis_voice',
    auth: true,

    handle: async (c) => {
        const body = await c.req.parseBody();

        if(body) {
            // Get logged in user from auth token
            const tokenData = c.get('auth_user');

            try {
                // Transcribe the given text
                const transription = await api.llm.voiceTranscribe(body['file']);
                
                // Analyze user input
                const analysis = await api.llm.analyzeUserInput(transription);
        
                // Register analysis to database
                await api.data.addUserAnalysis(tokenData.id, transription, analysis);

                // Return the analysis
                c.status(200);
                return c.json(analysis);
            } catch(e) {
                console.error(e);
                c.status(e.status);
                return c.json({
                    message: e.message,
                    code: e.code
                });
            }

        } else {
            console.error('malformed reqest');
            c.status(400);
            return c.json({
                message: 'Malformed request'
            });
        }
    }

};