/**
 * Authorize API endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/auth/authorize',
    auth: false,

    handle: async (c) => {
        const body = await c.req.json();
        const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || c.req.header('X-Forwarded-For') || null;

        if('id_token' in body && 'code_challenge' in body && 'client_id' in body) {
            let data;
            
            try {
                data = await api.accounts.auth.authorize(body.id_token, body.code_challenge, body.client_id);
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