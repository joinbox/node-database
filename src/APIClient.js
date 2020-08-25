import superagent from 'superagent';
import logd from 'logd';
import path from 'path';

const log = logd.module(path.basename(new URL(import.meta.url).pathname, '.js'));



/**
 * Abstraction for creating API clients
 *
 * @class      APIClient (name)
 */


export default class APIClient {


    /**
     * Constructs a new instance.
     *
     * @param      {Object}  arg1           Options object
     * @param      {string}  arg1.hostname  The hostname to send requests to
     * @param      {string}  arg1.pathname  The pathname to send requests to
     * @param      {string}  arg1.name      the name of this api client
     */
    constructor({
        hostname,
        pathname,
        name,
    }) {
        this.pathname = pathname;
        this.hostname = hostname;
        this.name = name;

        log.debug(`API Client ${this.name} will send requests to ${this.hostname}${this.pathname}`);
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
    async get(query = {}) {
        const id = Math.round(Math.random()*100000000);
        const start = Date.now();
        const url = this.hostname+this.pathname;

        log.debug(`[${id}] Sending GET request to ${this.hostname}${this.pathname}; query = ${JSON.stringify(query)}`);

        const response = await superagent.get(url)
            .accept('application/json')
            .query(query)
            .ok((response) => {
                if (response.status !== 200) {
                    throw new Error(`GET Request to ${url} faield with the status ${response.status}!`);
                } else {
                    return true;
                }
            })
            .send();

        log.debug(`[${id}][${Date.now()-start}msec] Got a response for the GET request to ${this.hostname}${this.pathname}`);

        if (response.body && response.body.length !== undefined) {
            log.info(`[${id}] reponse for request to ${this.hostname}${this.pathname} contains ${response.body.length} records`);
            log.debug(`[${id}] data for request to ${this.hostname}${this.pathname}: ${JSON.stringify(response.body).substr(0, 500)}`);
        }

        return response.body;
    }



}
