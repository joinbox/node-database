import HTTPClient from '../HTTPClient.js';
import XMLParser from 'fast-xml-parser';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



export default class SOAPDataLoader extends HTTPClient {



    constructor({
        hostname,
        pathname,
        name,
        captureData,
        username,
        password,
    }) {
        const accept = 'text/xml';
        log.debug(`Seting the accept header to ${accept}`);

        super({
            hostname,
            pathname,
            name,
            accept,
            method: 'post',
            captureData,
            username,
            password,
        });
    }



    async load() {
        const body = this.createPOSTBody();
        const headers = this.createPOSTHeaders();

        return this.request({
            body,
            headers,
        });
    }



    createPOSTHeaders() {
        return new Map([['content-type', 'text/xml']]);
    }



    parseBody(text) {
        const data = XMLParser.parse(text);
        return data['Soap:Envelope']['Soap:Body'];
    }
}