/**
 * Fetch from Time Range API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/data/fetch_time_range',
    auth: true,

    handle: async (c) => {
        const body = await c.req.json();

        if('time_start' in body && 'time_end' in body) {

            // Get logged in user from auth token
            const tokenData = c.get('auth_user');

            try {
                // Get data from time range
                const data = await api.data.getDataFromTimeRange(tokenData.id, Number(body.time_start), Number(body.time_end));

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