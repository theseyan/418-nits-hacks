/**
 * Get Day Analysis API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/data/get_day_analysis',
    auth: true,

    handle: async (c) => {
        const body = await c.req.json();

        if('day_start' in body && 'day_end' in body && 'utc_offset' in body) {

            // Get logged in user from auth token
            const tokenData = c.get('auth_user');

            try {
                // Get data from time range
                const data = await api.data.getDayAnalysis(tokenData.id, Number(body.day_start), Number(body.day_end), Number(body.utc_offset));

                // Return the analysis
                c.status(200);
                return c.json(data);
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