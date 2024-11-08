/**
 * Utility functions library
 * Mostly for logging into Discord
*/

const axios = require('axios');
const config = require('./config.json');

module.exports = new class Utils {

    /**
     * Logger API
    */
    logger = {

        /**
         * Puts a message into the log.
         * @param {string} type - Type of message. Possible values are `info`, `warn`, `error`.
         * @param {string} message - Message content
        */
        put: async (type, message) => {
            let content;

            if(type === `info`) content = `**[info]** ${message}`;
            else if(type === `warn`) content = `**[warn]** ${message}`;
            else if(type === `error`) content = `**[error]** ${message}\n<@&${config.logger.discord.role}>`;

            const body = {
                content: content,
                username: '418 NITS Hacks 7.0',
                allowed_mentions: {
                    parse: [],
                    roles: [config.logger.discord.role]
                }
            };

            // Send the log to Discord
            try {
                await axios.post(config.logger.discord.webhook_url, body);
            } catch(e) {
                console.error(`Logger error`, e.message);
            }
        },

        /**
         * Puts a info message into the log.
         * @param {string} message - Message content
        */
        log: (message) => {
            this.logger.put('info', message);
        },
    
        /**
         * Puts an error message into the log.
         * @param {string} message - Message content
        */
        error: (message) => {
            this.logger.put('error', message);
        },
    
        /**
         * Puts a warning message into the log.
         * @param {string} message - Message content
        */
        warn: (message) => {
            this.logger.put('warn', message);
        }
    };

};