import section from 'section-tests';
import HTTPClient from '../src/HTTPClient.js';
import express from 'express';
import assert from 'assert';


section('API Client', (section) => {
    section.test('Setting up && Shutting down', async() => {
        const client = new HTTPClient({
            hostname: 'http://l.dns.porn',
            pathname: '/user',
            name: 'user',
        });
    });



    section.test('Send a GET request', async() => {
        const client = new HTTPClient({
            hostname: 'http://l.dns.porn:9282',
            pathname: '/user',
            name: 'user',
            accept: 'application/json'
        });

        const server = express();
        
        server.get('/user', async(request, response) => {
            response
                .status(200)
                .set('content-type', 'application/json')
                .end(JSON.stringify([{id: 10}]));
        });

        const serverInstance = server.listen(9282);
        const data = await client.request();

        assert.equal(data[0].id, 10);

        serverInstance.close();
        await section.wait(10);
    });
});