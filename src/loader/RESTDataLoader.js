import HTTPClient from '../HTTPClient.js';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



export default class RESTDataLoader extends HTTPClient {


    constructor({
        hostname,
        pathname,
        name,
    }) {
        const accept = 'application/json';
        log.debug(`Seting the accept header to ${accept}`);

        super({
            hostname,
            pathname,
            name,
            accept,
        });
    }


    async load() {
        log.info(`Loading data ...`);
        const data = this.request();
        log.info(`Data loaded!`);
        return data;
    }
}