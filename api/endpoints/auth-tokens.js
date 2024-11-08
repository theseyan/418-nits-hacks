/**
 * Tokens Exchange API endpoint
*/

const api = require('../api');

module.exports = {

    type: 'post',
    route: '/auth/tokens',
    auth: false,

    handle: async (c) => {
        const body = await c.req.json();

        if('auth_code' in body && 'code_verifier' in body && 'client_id' in body) {
            let data;
            
            try {
                data = await api.accounts.auth.exchangeAuthCode(body.auth_code, body.code_verifier, body.client_id);
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