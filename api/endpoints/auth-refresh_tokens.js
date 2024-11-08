/**
 * Refresh Tokens API endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/auth/refresh_tokens',
    auth: false,

    handle: async (c) => {
        const body = await c.req.json();

        if('refresh_token' in body) {
            let data;
            
            try {
                data = await api.accounts.auth.refreshTokenPair(body.refresh_token);
            } catch(e) {
                c.status(e.status);
                return c.json({
                    message: e.message,
                    code: e.code
                });
            }

            return c.json(data);
        } else {
            c.status(400);
            return c.json({
                message: 'Malformed request'
            });
        }
    }

};