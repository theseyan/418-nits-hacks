/**
 * Create Account API endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/auth/create_account',
    auth: false,

    handle: async (c) => {
        const body = await c.req.json();
        const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || c.req.header('X-Forwarded-For') || null;

        if('id_token' in body) {
            let data;
            
            try {
                data = await api.accounts.createUser({
                    idToken: body.id_token
                });
            } catch(e) {
                c.status(e.status);
                return c.json({
                    message: e.message,
                    code: e.code
                });
            }

            return c.json({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            });
        }else {
            c.status(400);
            return c.json({
                message: 'Malformed request'
            });
        }
    }

};