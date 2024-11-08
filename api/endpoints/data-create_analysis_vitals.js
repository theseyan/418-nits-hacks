/**
 * Create Analysis from Vital data API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/data/create_analysis_vitals',
    auth: true,

    handle: async (c) => {
        const body = await c.req.json();
        // heartbeats per minute, sleep data, steps walked in the day, and blood oxygen levels.
        if('heartbeats_rpm' in body && 'sleep_hrs' in body && 'steps_per_day' in body && 'spo2' in body) {

            // Get logged in user from auth token
            const tokenData = c.get('auth_user');

            try {
                // Analyze user input
                const dataString = JSON.stringify({
                    heartbeats_per_minute: body.heartbeats_rpm,
                    sleep_per_night: body.sleep_hrs,
                    steps_per_day: body.steps_per_day,
                    blood_oxygen_levels: body.spo2
                });

                const analysis = await api.llm.analyzeVitals(dataString);

                // Register analysis to database
                await api.data.addUserAnalysis(tokenData.id, dataString, analysis);

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