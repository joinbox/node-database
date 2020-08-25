import section from 'section-tests';
import APIClientFactory from '../src/APIClientFactory.js';
import assert from 'assert';
import express from 'express';


section('API Client Factory', (section) => {
    return;
    section.test('Creating an APIClient', async() => {
        const factory = new APIClientFactory({
            hostname: 'http://l.dns.porn:9282',
        });

        const client = factory.createClient({
            name: 'user',
            pathname: '/user'
        });

        const app = express();
        
        app.get('/user', async(request, response) => {
            return response
                .status(200)
                .set('content-type', 'application/json')
                .send(JSON.stringify([{id: 10}]));
        });

        const server = app.listen(9282);


        const data = await client.get();

        assert.equal(data[0].id, 10);

        await server.close();
        await client.end();
    });
});