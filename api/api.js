/**
 * API library
*/

const jwt = require('jsonwebtoken');
const fs = require('fs');
const escaper = require('html-escaper');
const argon2 = require('argon2');
const hyperid = require('hyperid')();
const { ulid } = require('ulidx');
const crypto = require("crypto");
const {OAuth2Client} = require('google-auth-library');
const oauthClient = new OAuth2Client();
const NodeCache = require("node-cache");
const {Groq} = require('groq-sdk');
const path = require('path');
const yup = require('yup');
const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");

const config = require('../config.json');
const db = require('../db').db;
const logger = require('../util').logger;
const Errors = require('./Errors');
const { StringRecordId, RecordId } = require('surrealdb');

// Initialize Groq API
const groq = new Groq({ apiKey: config.api.keys.groq_api });

// Load keys from disk
const accessTokenPrivateKey = fs.readFileSync(config.auth.keys.access_token_private_key);
const accessTokenPublicKey = fs.readFileSync(config.auth.keys.access_token_public_key);
const refreshTokenPrivateKey = fs.readFileSync(config.auth.keys.refresh_token_private_key);
const refreshTokenPublicKey = fs.readFileSync(config.auth.keys.refresh_token_public_key);

// Load LLM prompts from disk
const Prompts = {
    ANALYZE_USER_INPUT: fs.readFileSync(path.join(__dirname, './prompts/analyze_user_input.txt')).toString(),
    ANALYZE_DAY: fs.readFileSync(path.join(__dirname, './prompts/analyze_day.txt')).toString(),
    GEN_JOURNAL: fs.readFileSync(path.join(__dirname, './prompts/generate_journal.txt')).toString(),
    ANALYZE_VITALS: fs.readFileSync(path.join(__dirname, './prompts/analyze_vital_data.txt')).toString(),
    AUTOFILL_SAT: fs.readFileSync(path.join(__dirname, './prompts/autofill_sat.txt')).toString(),
};

// Set up authorization code cache
const authCodeCache = new NodeCache({
    stdTTL: config.auth.auth_code_ttl,
    checkperiod: 60,
    deleteOnExpire: true
});

// Whether this is Bun
const IS_BUN = !(typeof Bun === "undefined");

const API = {

    /**
     * LLM related API
    */
    llm: {

        /**
         * Queries the Groq API
        */
        query: async (system, input, schema = null, retry = 0) => {
            // Don't exceed more than 3 retries
            if (retry >= 3) {
                throw new Errors.BadRequestError("This LLM query cannot be processed");
            }

            let response;
            try {
                response = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: system,
                        },
                        {
                            role: "user",
                            content: input
                        }
                    ],
                    model: "llama-3.1-70b-versatile",
                    temperature: 0.3,
                    stream: false,
                    response_format: {
                        type: "json_object"
                    }
                });
            } catch (e) {
                console.error(e);
                throw new Errors.InternalServerError("An error occurred while fetching LLM response");
            }

            if (response.choices[0] && response.choices[0].message.content) {
                const json = JSON.parse(response.choices[0].message.content);

                // Check if LLM returned an error.
                if ('error' in json) {
                    throw new Errors.BadRequestError("Invalid input! Please provide accurate and detailed information.");
                }

                // Validate response schema
                if (schema) {
                    const isValid = await schema.isValid(json);

                    if (isValid === false) {
                        console.error('Invalid schema returned from LLM API');
                        
                        // Try again
                        return await API.llm.query(system, input, schema, retry + 1);
                    } else {
                        return json;
                    }
                }
            } else {
                throw new Errors.InternalServerError("LLM response was empty");
            }
        },

        /**
         * Analyzes given user status/mood and provides data
        */
        analyzeUserInput: async (input) => {
            const schema = yup.object().shape({
                overall_mood: yup.number().required().integer(),
                happiness: yup.number().required().integer(),
                sadness: yup.number().required().integer(),
                anxiety: yup.number().required().integer(),
                pain: yup.number().required().integer(),
                anger: yup.number().required().integer(),
                excitement: yup.number().required().integer(),
                depression: yup.number().required().integer(),
                life_threatening: yup.boolean().required(),
                summary: yup.string().required(),
                potential_issues: yup.lazy((value) => typeof value === 'string' ? yup.string().required() : yup.boolean().required()),
                feedback: yup.string().required(),
            });

            return API.llm.query(Prompts.ANALYZE_USER_INPUT, input, schema);
        },

        /**
         * Analyzes given vital input data
        */
        analyzeVitals: async (input) => {
            const schema = yup.object().shape({
                overall_mood: yup.number().required().integer(),
                happiness: yup.number().required().integer(),
                sadness: yup.number().required().integer(),
                anxiety: yup.number().required().integer(),
                pain: yup.number().required().integer(),
                anger: yup.number().required().integer(),
                excitement: yup.number().required().integer(),
                depression: yup.number().required().integer(),
                life_threatening: yup.boolean().required(),
                summary: yup.string().required(),
                potential_issues: yup.lazy((value) => typeof value === 'string' ? yup.string().required() : yup.boolean().required()),
                feedback: yup.string().required(),
            });

            return API.llm.query(Prompts.ANALYZE_VITALS, input, schema);
        },

        /**
         * Analyzes day data.
        */
        analyzeDay: async (input) => {
            const schema = yup.object().shape({
                summary: yup.string().required(),
                feedback: yup.string().required()
            });

            return API.llm.query(Prompts.ANALYZE_DAY, input, schema);
        },

        /**
         * Analyzes day data for Journal generation.
        */
        generateJournalEntry: async (input) => {
            const schema = yup.object().shape({
                text: yup.string().required(),
            });

            return API.llm.query(Prompts.GEN_JOURNAL, input, schema);
        },

        voiceTranscribe: async (buffer) => {
            // Create a transcription job
            const transcription = await groq.audio.transcriptions.create({
                file: buffer,
                model: "distil-whisper-large-v3-en",
                prompt: "Indian english accent and tone",
                response_format: "json",
                language: "en",
            });

            return transcription.text;
        }

    },

    /**
     * Data related API
    */
    data: {

        /**
         * Registers a User Input Analysis to the database.
        */
        addUserAnalysis: async (userId, input, analysis) => {
            try {
                const id = ulid();
                const date = Math.round(Date.now() / 1000);

                const result = await db.query(`CREATE user_analyses SET id = $id, input = $input, analysis = $analysis, date = $date`, {
                    id: [new StringRecordId(userId), id],
                    input: input,
                    analysis: analysis,
                    date: date
                });
            } catch (e) {
                console.error(e);
                throw new Errors.InternalServerError("Could not register user analysis due to an internal error");
            }
        },

        /**
         * Fetches user analysis data points in a given time range
        */
        getDataFromTimeRange: async (userId, timeStart, timeEnd) => {
            const startUlid = ulid(timeStart);
            const endUlid = ulid(timeEnd);
            
            let result;
            try {
                result = await db.query(`SELECT analysis.anxiety AS anxiety, analysis.happiness AS happiness, analysis.overall_mood AS mood, analysis.sadness AS sadness, date FROM user_analyses:[$user, $start]..[$user, $end]`, {
                    user: new StringRecordId(userId),
                    start: startUlid,
                    end: endUlid
                });
            } catch (e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }

            return result[0];
        },

        /**
         * Fetches the day analysis.
        */
        getDayAnalysis: async (userId, dayStart, dayEnd, utcOffset) => {
            const startUlid = ulid(dayStart);
            const endUlid = ulid(dayEnd);

            // Get dayjs instance
            dayjs.extend(utc);

            // Get data for day analysis
            let data;
            try {
                data = await db.query(`SELECT analysis.anger AS anger, analysis.depression AS depression, analysis.excitement AS excitement, analysis.pain AS pain, analysis.anxiety AS anxiety, analysis.happiness AS happiness, analysis.overall_mood AS mood, analysis.sadness AS sadness, analysis.summary AS summary, date FROM user_analyses:[$user, $start]..[$user, $end]`, {
                    user: new StringRecordId(userId),
                    start: startUlid,
                    end: endUlid
                });

                // Check if data exists for analysis
                if (data[0].length < 1) return null;

                data = data[0];

                // Get latest user analysis date
                const latestUpdateDate = data.sort((a, b) => b.date - a.date)[0].date;

                // Check if day analysis data already exists and is up to date
                const analysisRecord = await db.query(`SELECT * FROM day_analyses:[$user, $dayStart]`, {
                    user: new StringRecordId(userId),
                    dayStart: dayStart
                });
                
                // Check if day analysis is missing OR if its outdated
                if (analysisRecord[0].length < 1 || analysisRecord[0][0].last_update < latestUpdateDate) {
                    // Generate new analysis
                    const inputData = data.map(({anger, depression, excitement, pain, anxiety, happiness, sadness, mood, summary, date}) => ({
                        anger, depression, excitement, pain, anxiety, happiness, sadness, mood, summary,
                        time: dayjs.unix(date).utc().utcOffset(utcOffset).format("hh:mm A")
                    }));

                    const dayAnalysis = await API.llm.analyzeDay(JSON.stringify(inputData));

                    // Update/create the analysis record
                    if (analysisRecord[0].length < 1) {
                        await db.query(`CREATE day_analyses:[$user, $dayStart] SET summary = $summary, feedback = $feedback, last_update = $lastUpdate`, {
                            user: new StringRecordId(userId),
                            dayStart: dayStart,
                            summary: dayAnalysis.summary,
                            feedback: dayAnalysis.feedback,
                            lastUpdate: latestUpdateDate
                        });
                    } else {
                        await db.query(`UPDATE day_analyses:[$user, $dayStart] SET summary = $summary, feedback = $feedback, last_update = $lastUpdate`, {
                            user: new StringRecordId(userId),
                            dayStart: dayStart,
                            summary: dayAnalysis.summary,
                            feedback: dayAnalysis.feedback,
                            lastUpdate: latestUpdateDate
                        });
                    }

                    return {
                        summary: dayAnalysis.summary,
                        feedback: dayAnalysis.feedback,
                        data: data
                    };
                }
                // Record already exists and is up to date
                else {
                    return {
                        summary: analysisRecord[0][0].summary,
                        feedback: analysisRecord[0][0].feedback,
                        data: data
                    };
                }
            } catch (e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }
        },

        /**
         * Generates or fetches the journal entry for a day.
        */
        getJournalEntry: async (userId, dayStart, dayEnd, utcOffset) => {
            const startUlid = ulid(dayStart);
            const endUlid = ulid(dayEnd);

            // Get dayjs instance
            dayjs.extend(utc);

            // Get data for day analysis
            let data;
            try {
                data = await db.query(`SELECT analysis.overall_mood AS mood, input, date FROM user_analyses:[$user, $start]..[$user, $end]`, {
                    user: new StringRecordId(userId),
                    start: startUlid,
                    end: endUlid
                });

                // Check if data exists for analysis
                if (data[0].length < 1) return null;

                data = data[0];

                // Get latest user analysis date
                const latestUpdateDate = data.sort((a, b) => b.date - a.date)[0].date;

                // Check if a journal entry already exists and is up to date
                const journalRecord = await db.query(`SELECT * FROM journals:[$user, $dayStart]`, {
                    user: new StringRecordId(userId),
                    dayStart: dayStart
                });
                
                // Check if journal record missing OR if its outdated
                if (journalRecord[0].length < 1 || journalRecord[0][0].last_update < latestUpdateDate) {
                    // Generate new journal entry
                    const inputData = data.map(({mood, input, date}) => ({
                        input,
                        time: dayjs.unix(date).utc().utcOffset(utcOffset).format("hh:mm A")
                    }));

                    const journalEntry = await API.llm.generateJournalEntry(JSON.stringify(inputData));

                    // Update/create the entry record
                    if (journalRecord[0].length < 1) {
                        await db.query(`CREATE journals:[$user, $dayStart] SET text = $text, last_update = $lastUpdate`, {
                            user: new StringRecordId(userId),
                            dayStart: dayStart,
                            text: journalEntry.text,
                            lastUpdate: latestUpdateDate
                        });
                    } else {
                        await db.query(`UPDATE journals:[$user, $dayStart] SET text = $text, last_update = $lastUpdate`, {
                            user: new StringRecordId(userId),
                            dayStart: dayStart,
                            text: journalEntry.text,
                            lastUpdate: latestUpdateDate
                        });
                    }

                    return {
                        text: journalEntry.text,
                        dayStart: dayStart
                    };
                }
                // Record already exists and is up to date
                else {
                    return {
                        text: journalRecord[0][0].text,
                        dayStart: dayStart
                    };
                }
            } catch (e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }
        },

    },

    /**
     * Accounts related API
    */
    accounts: {

        /**
         * Passwords related API
        */
        password: {

            /**
             * Hashes a given password using argon2id.
             * @param {string} password - Plaintext password
            */
            hash: async (password) => {
                if(password === ``) throw new Errors.BadRequestError(`Cannot accept an empty password.`);

                try {
                    if(IS_BUN) {
                        return await Bun.password.hash(password, {
                            memoryCost: 16 * 1024,
                            timeCost: 3
                        });
                    }else {
                        return await argon2.hash(password, {
                            type: argon2.argon2id,
                            memoryCost: 16 * 1024,
                            timeCost: 3
                        });
                    }
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }
            },

            /**
             * Verifies a given password against a hash.
             * @param {string} password - Plaintext password
             * @param {string} hash - Password hash
            */
            verify: async (password, hash) => {
                try {
                    if(IS_BUN) {
                        return await Bun.password.verify(password, hash, "argon2id");
                    } else {
                        return await argon2.verify(hash, password, {
                            type: argon2.argon2id,
                            memoryCost: 4,
                            timeCost: 3
                        });
                    }
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError(`Internal error while verifying password.`);
                }
            },

        },

        /**
         * Authentication related API
        */
        auth: {

            /**
             * Verifies a Google ID token
            */
            verifyGoogleIdToken: async (token) => {
                let payload;
                try {
                    const ticket = await oauthClient.verifyIdToken({
                        idToken: token,
                        audience: config.api.keys.google_oauth_client_ids
                    });

                    payload = ticket.getPayload();
                } catch(e) {
                    throw new Errors.UnauthorizedError("Invalid GIS ID token");
                }

                return {
                    id: payload['sub'],
                    email: payload['email'],
                    name: payload['name'],
                    pfp: payload['picture'] ? payload['picture'] : null
                };
            },

            /**
             * Verifies a Cloudflare Turnstile CAPTCHA token.
             * @param {string} token - Turnstile CAPTCHA token
             * @param {string} remoteip - Remote user IP
            */
            verifyTurnstileCode: async (token, remoteip, type = 'auth') => {
                const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
                const secret = (type === 'auth') ? config.api.keys.auth_turnstile_secret : config.api.keys.invisible_turnstile_secret;

                try {
                    const result = await fetch(url, {
                        body: JSON.stringify({
                            secret: secret,
                            response: token,
                            remoteip: remoteip
                        }),
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                
                    const outcome = await result.json();
                    if (outcome.success === true) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }
            },

            /**
             * Verifies a PKCE code challenge against a verifier.
             * @param {string} code_challenge - PKCE Code challenge
             * @param {string} code_verifier - PKCE Code verifier
            */
            verifyPkceChallenge: async (code_challenge, code_verifier) => {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(code_verifier);
                    const s256 = await crypto.subtle.digest('SHA-256', data);

                    // Base64 URL encode the hash
                    const challenge = btoa(String.fromCharCode.apply(null, new Uint8Array(s256))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

                    return (challenge === code_challenge);
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }
            },

            /**
             * Verifies a given Access token
             * @param {string} token - Access token
            */
            verifyAccessToken: (token) => new Promise((resolve, reject) => {
                jwt.verify(token, accessTokenPublicKey, {
                    algorithms: ['RS256']
                }, (err, payload) => {
                    if(err) {
                        return reject(new Errors.UnauthorizedError("Invalid or expired access token"));
                    }

                    const id = payload.id;

                    return resolve({
                        id
                    });
                });
            }),

            /**
             * Generates an authorization code given valid login credentials
             * and a valid OAuth 2.0 PKCE code challenge.
             * @param {string} idToken - GIS ID token
             * @param {string} codeChallenge - PKCE code challenge
             * @param {string} clientId - Client ID
            */
            authorize: async (idToken, codeChallenge, clientId) => {
                // Verify client ID
                if(config.auth.client_ids.includes(clientId) === false) {
                    throw new Errors.UnauthorizedError("Invalid or unregistered client ID");
                }

                // Verify ID Token
                let userData;
                try {
                    userData = await API.accounts.auth.verifyGoogleIdToken(idToken);
                } catch(e) {
                    throw new Errors.UnauthorizedError("Invalid or malformed GIS ID token");
                }

                // Fetch user record
                let user;
                try {
                    user = await db.query(`SELECT * FROM users WHERE authentication.google_id = $gid LIMIT 1`, {
                        gid: userData.id
                    });
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }

                // Make sure user exists
                if (user[0].length < 1) throw new Errors.UnauthorizedError("User account does not exist");

                user = user[0][0];

                // Check if user is disabled / banned
                if(user.disabled === true) {
                    throw new Errors.UnauthorizedError("Account is disabled. Please contact support.");
                }

                // Generate authorization code
                const authCode = hyperid();

                // Store auth code and related data
                try {
                    authCodeCache.set(authCode, {
                        clientId: clientId,
                        userId: user.id,
                        codeChallenge: codeChallenge,
                        expires: Date.now() + (config.auth.auth_code_ttl * 1000)
                    });
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }

                return {
                    auth_code: authCode
                };
            },

            /**
             * Exchanges an authorization code and valid code verifier for a pair of access & refresh tokens.
             * @param {string} authCode - Authorization code
             * @param {string} codeVerifier - PKCE code verifier
             * @param {string} clientId - Client ID
            */
            exchangeAuthCode: async (authCode, codeVerifier, clientId) => {
                let authCodeRecord;
                try {
                    authCodeRecord = authCodeCache.get(authCode);
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }

                // Validate auth code exists and not expired
                if(authCodeRecord === undefined || Date.now() >= authCodeRecord.expires) {
                    throw new Errors.UnauthorizedError("Authorization code is invalid or expired");
                }

                // Verify client ID
                if(authCodeRecord.clientId !== clientId) {
                    throw new Errors.UnauthorizedError("Invalid or unknown client ID");
                }

                // Verify code challenge
                const challengeVerified = await API.accounts.auth.verifyPkceChallenge(authCodeRecord.codeChallenge, codeVerifier);
                if(challengeVerified === false) {
                    throw new Errors.UnauthorizedError("Code challenge verification failed");
                }

                // Now, we can generate access and refresh tokens
                const tokens = await API.accounts.auth.generateTokenPair(authCodeRecord.userId);

                return {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                };
            },

            /**
             * Generates fresh access & refresh token pair for a user.
             * @param {string} userId - User ID
            */
            generateTokenPair: async (userId) => {
                let accessToken, refreshToken, rtid, recordCount;

                try {
                    // Generate access token
                    accessToken = jwt.sign({
                        id: userId,
                    }, accessTokenPrivateKey, {
                        algorithm: 'RS256',
                        expiresIn: config.auth.limits.access_token_duration,
                    });

                    // Generate refresh token
                    rtid = hyperid();
                    refreshToken = jwt.sign({
                        id: userId,
                        parent_token: null,
                    }, refreshTokenPrivateKey, {
                        algorithm: 'RS256',
                        expiresIn: config.auth.limits.refresh_token_duration,
                        jwtid: rtid
                    });

                    // Check if the limit of active refresh tokens has been reached
                    recordCount = await db.query(`SELECT count() AS count FROM refresh_tokens WHERE user_id = $user`, {
                        user: userId
                    });
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }

                if(recordCount[0][0] && recordCount[0][0].count >= config.auth.limits.active_refresh_tokens) {
                    throw new Errors.ForbiddenError("Too many logged-in devices. Please log out and try again.");
                }

                try {
                    // Save refresh token to database
                    await db.query(`CREATE ONLY refresh_tokens SET id = $id, user = $user, parent_token_id = $parent, issued_at = $created`, {
                        id: rtid,
                        parent: rtid,
                        user: userId,
                        created: Math.floor(new Date().getTime() / 1000),
                    });
                } catch (e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }

                return {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                };
            },

            /**
             * Generates a new pair of refresh & access tokens, and invalidates the last one.
             * @param {string} oldRefreshToken - Old refresh token to consume.
            */
            refreshTokenPair: (oldRefreshToken) => new Promise((resolve, reject) => {
                jwt.verify(oldRefreshToken, refreshTokenPublicKey, {
                    algorithms: ['RS256']
                }, async (err, payload) => {
                    if(err) {
                        // Refresh token was invalid
                        return reject(new Errors.UnauthorizedError("Invalid, malformed or expired refresh token"));
                    } else {
                        const old_id = payload.jti;
                        const userId = payload.id;
                        const old_expiry = payload.exp;
                        const parentToken = payload.parent_token ?? payload.jti;

                        try {
                            const tokenQuery = await db.query(`SELECT 1 FROM $id`, {
                                id: new RecordId("refresh_tokens", old_id)
                            });
                            
                            // Check if refresh token is active in database records
                            if(tokenQuery[0].length < 1) {
                                // Refresh token not found in database; it must be stale
                                // so we revoke the family of this token
                                logger.warn(`Stale refresh token used for family ID \`${parentToken}\`. Token family will be revoked from database.`);
                                await API.accounts.auth.revokeTokenFamily(parentToken);

                                return reject(new Errors.UnauthorizedError("Invalid, malformed or expired refresh token"));
                            }
                        } catch(e) {
                            console.error(e);
                            throw new Errors.InternalServerError();
                        }

                        let accessToken, rtid, refreshToken;

                        try {
                            // Generate new access token
                            accessToken = jwt.sign({
                                id: userId,
                            }, accessTokenPrivateKey, {
                                algorithm: 'RS256',
                                expiresIn: config.auth.limits.access_token_duration,
                            });

                            // Generate new refresh token
                            rtid = hyperid();
                            refreshToken = jwt.sign({
                                id: userId,
                                parent_token: parentToken
                            }, refreshTokenPrivateKey, {
                                algorithm: 'RS256',
                                jwtid: rtid,
                                expiresIn: config.auth.limits.refresh_token_duration
                            });

                            // Delete stale token and add new token in database
                            await db.query(
                                `BEGIN TRANSACTION;
                                DELETE $old_id;
                                CREATE ONLY refresh_tokens SET id = $id, user = $user, parent_token_id = $parent, issued_at = $created;
                                COMMIT TRANSACTION;`,
                            {
                                id: rtid,
                                old_id: new RecordId("refresh_tokens", old_id),
                                user: userId,
                                created: Math.floor(new Date().getTime() / 1000),
                                parent: parentToken
                            });
                        } catch(e) {
                            console.error(e);
                            throw new Errors.InternalServerError();
                        }

                        return resolve({
                            accessToken: accessToken,
                            refreshToken: refreshToken
                        });

                    }
                });
            }),

            /**
             * Revokes any refresh tokens originating from the given parent token ID, inclusive.
             * @param {string} tokenId - Token ID of parent refresh token.
            */
            revokeTokenFamily: async (tokenId) => {
                try {
                    await db.query(`DELETE refresh_tokens WHERE parent_token_id = $id`, {
                        id: tokenId
                    });
                } catch(e) {
                    console.error(e);
                    throw new Errors.InternalServerError();
                }
            },

            /**
             * Logs out a device given a valid refresh token for that device.
             * @param {string} refreshToken - Refresh token associated to device.
            */
            logout: (refreshToken) => new Promise((resolve, reject) => {
                jwt.verify(refreshToken, refreshTokenPublicKey, {
                    algorithms: ['RS256']
                }, async (err, payload) => {
                    if(err) {
                        return reject(new Errors.UnauthorizedError("Invalid or expired refresh token"));
                    }

                    const id = payload.parent_token ?? payload.jti;

                    try {
                        // Revoke all refresh tokens in this family
                        await API.accounts.auth.revokeTokenFamily(id);
                    } catch(e) {
                        console.error(e);
                        return reject(new Errors.InternalServerError());
                    }

                    return resolve();
                });
            }),

        },

        /**
         * Creates a new account
         * @async
         * @param {string} data.idToken - GIS ID token
        */
        createUser: async (data) => {

            // Verify ID Token
            let userData;
            try {
                userData = await API.accounts.auth.verifyGoogleIdToken(data.idToken);
            } catch(e) {
                throw new Errors.UnauthorizedError("Invalid or expired GIS ID token");
            }

            // Check if username or e-mail already exists
            let userExists;
            try {
                userExists = await db.query(`SELECT id FROM users WHERE authentication.google_id = $gid LIMIT 1`, {
                    gid: userData.id
                });
            } catch(e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }

            // Check if Username or Email already exists
            if(userExists[0].length > 0) {
                throw new Errors.ResourceExistsError(`User account already exists. Please log in instead.`);
            }

            // Generate an ID for this user
            const id = ulid();

            // Insert record to database
            let insertOp;
            try {
                insertOp = await db.query(`CREATE users SET id = $id, authentication = $authentication, full_name = $full_name, email = $email, pfp = $pfp, joined_at = $joinedAt, disabled = false`, {
                    id: id,
                    authentication: {
                        google_id: userData.id
                    },
                    full_name: userData.name,
                    email: userData.email,
                    pfp: userData.pfp,
                    joinedAt: Math.floor((new Date()).getTime() / 1000)
                });

                logger.log(`New Account created: ${userData.name} [ID: ${id}]`);
            } catch(e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }

            return insertOp[0][0];

        },

        /**
         * Creates a new account as well as login tokens.
        */
        createUserAndLogin: async (data) => {
            const account = await API.accounts.createUser(data);

            // Generate tokens
            const tokens = await API.accounts.auth.generateTokenPair(account.id);

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            };
        },

        /**
         * Fetches User data by ID
         * @async
         * @param {string} id - User ID
        */
        getUser: async (id) => {
            let user;
            try {
                user = await db.query(`SELECT id, full_name, email, pfp, joined_at FROM $id`, {
                    id: new StringRecordId(id)
                });
            } catch(e) {
                console.error(e);
                throw new Errors.InternalServerError();
            }

            // Check if user ID exists
            if(user[0].length < 1) throw new Errors.ResourceNotFoundError(`User ID does not exist.`);

            return {
                id: user[0][0].id,
                fullName: user[0][0].full_name,
                email: user[0][0].email,
                pfp: user[0][0].pfp,
                joinedAt: user[0][0].joined_at
            };
        }

    }

};

// Export API functions
module.exports = API;