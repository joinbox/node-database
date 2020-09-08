import section from 'section-tests';
import { RESTDataLoader } from '../index.js';
import express from 'express';
import assert from 'assert';


section('RESTDataLoader', (section) => {
    section.test('Setting up && Shutting down', async() => {
        const client = new RESTDataLoader({
            hostname: 'http://l.dns.porn',
            pathname: '/user',
            name: 'user',
        });
    });



    section.test('Load data', async() => {
        const client = new RESTDataLoader({
            hostname: 'http://l.dns.porn:9282',
            pathname: '/user',
            name: 'user',
        });

        const server = express();
        
        server.get('/user', async(request, response) => {
            response
                .status(200)
                .set('content-type', 'application/json')
                .end(JSON.stringify([{id: 10}]));
        });

        const serverInstance = server.listen(9282);


        const data = await client.load();

        assert.equal(data[0].id, 10);

        serverInstance.close();

        await section.wait(10);
    });
});