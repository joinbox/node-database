import APIClient from './APIClient.js';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));


export default class APIClientFactory {

    constructor({
        hostname,
    }) {
        this.hostname = hostname;
        log.info(`Setting up the APIClientFactory; using the hostname ${this.hostname}`);
    }


    createClient({
        name,
        pathname,
    }) {
        log.info(`Creating the APIClient ${name} using the pathname ${pathname}`);
        return new APIClient({
            name,
            pathname,
            hostname: this.hostname,
        });
    }
}

