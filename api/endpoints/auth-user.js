/**
 * User Details API Endpoint
*/

const api = require('../api');

module.exports = {

    type: 'get',
    route: '/auth/user',
    auth: true,

    handle: async (c) => {
        // Get logged in user from auth token
        const tokenData = c.get('auth_user');

        try {
            let userData = await api.accounts.getUser(tokenData.id);

            // Return user data
            c.status(200);
            return c.json({
                message: 'Fetched user details successfully',
                user: userData
            });
        } catch(e) {
            c.status(e.status);
            return c.json({
                message: e.message,
                code: e.code
            });
        }
    }

};