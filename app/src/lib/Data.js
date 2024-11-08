/**
 * Data API
*/

import {request, authRequest} from './HTTPClient';
import Errors from './Errors';
import config from '../config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Generates an analysis from user input.
export const createUserAnalysis = async (input) => {
    const response = await (await authRequest(config.api.host + '/data/create_analysis', {
        method: 'post',
        json: {
            prompt: input
        }
    })).json();
    
    return response;
};