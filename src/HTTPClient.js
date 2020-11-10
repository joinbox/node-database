import superagent from 'superagent';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



/**
 * Abstraction for creating HTTPClients
 *
 * @class      HTTPClient (name)
 */


export default class HTTPClient {


    /**
     * Constructs a new instance.
     *
     * @param      {Object}  arg1           Options object
     * @param      {string}  arg1.hostname  The hostname to send requests to
     * @param      {string}  arg1.pathname  The pathname to send requests to
     * @param      {string}  arg1.name      the name of this HTTPClient
     */
    constructor({
        hostname,
        pathname,
        name,
        accept = '*/*',
        expectStatus = 200,
        method = 'get',
        captureData = false,
    }) {
        this.pathname = pathname;
        this.hostname = hostname;
        this.name = name;
        this.accept = accept;
        this.expectedStatus = Array.isArray(expectStatus) ? expectStatus : [ expectStatus ];
        this.method = method;
        this.methodSignature = method.toUpperCase();
        this.captureData = captureData;
        this.rawData = [];

        log.debug(`HTTPClient ${this.name} will send requests to ${this.hostname}${this.pathname}`);
    }





    basicAuth(username, password) {
        log.info(`HTTPClient ${this.name} will send requests using basic auth with the username ${username}`);
        this.basicAuthValue = `basic ${new Buffer.from(`${username}:${password}`).toString('base64')}`;
    }


    /**
     * sends a get request to a defined path using optional query parameters
     *
     * @private
     * 
     * @param   {Object}      query     object containing query parameters
     * 
     * @returns {Promise}               a promise that resolves to a JSON object containing the data
     *                                  received from the server 
     */
    async request({
        query = {},
        body = null,
        headers = new Map(),
        pathname,
        timeout = 300,
    } = {}) {
        const id = Math.round(Math.random()*100000000);
        const start = Date.now();
        const url = this.hostname + (pathname || this.pathname);

        log.debug(`[${id}] Sending ${this.method.toUpperCase()} request to ${url}; query = ${JSON.stringify(query)}`);

        if (this.basicAuthValue) {
            headers.set('Authorization', this.basicAuthValue);
        }

        headers.set('Accept', this.accept);

        const response = await superagent[this.method](url)
            .query(query)
            .buffer()
            .timeout({ deadline: timeout * 1000, response: timeout * 1000 })
            .set(Object.fromEntries(headers.entries()))
            .ok((response) => {
                if (!this.expectedStatus.includes(response.status)) {
                    throw new Error(`${this.method.toUpperCase()} Request to ${url} failed with the status ${response.status}, expected ${this.expectedStatus.join(', ')}!`);
                } else {
                    return true;
                }
            })
            .send(body);

        log.debug(`[${id}][${Date.now()-start} msec] Got a response for the ${this.method.toUpperCase()} request to ${this.hostname}${this.pathname}`);

        if (response.body && response.body.length !== undefined) {
            log.info(`[${id}] reponse for request to ${this.hostname}${this.pathname} contains ${response.body.length} records`);
            log.debug(`[${id}] data for request to ${this.hostname}${this.pathname}: ${JSON.stringify(response.body).substr(0, 500)}`);

            return response.body;
        } else if (response.buffered) {
            if (this.captureData) { 
                this.rawData.push(response.text);
            }
            const parsedData = this.parseBody(response.text);
            return parsedData;
        }
    }
}
