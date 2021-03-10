import HTTPClient from '../HTTPClient.js';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



export default class RESTDataLoader extends HTTPClient {


    constructor({
        hostname,
        pathname,
        name,
        username,
        password,
        timeout,
    }) {
        const accept = 'application/json';
        log.debug(`Setting the accept header to ${accept}`);

        super({
            hostname,
            pathname,
            name,
            accept,
            username,
            password,
            timeout,
        });
    }


    async load() {
        log.info(`Loading data ...`);
        const data = await this.request();
        log.info(`Data loaded!`);
        log.debug(data);
        return data;
    }
}