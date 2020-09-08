import section from 'section-tests';
import { SOAPDataLoader } from '../index.js';
import express from 'express';
import assert from 'assert';


section('SOAPDataLoader', (section) => {
    section.test('Setting up && Shutting down', async() => {
        const client = new SOAPDataLoader({
            hostname: 'http://l.dns.porn',
            pathname: '/user',
            name: 'user',
        });
    });



    section.test('Load data', async() => {
        const client = new SOAPDataLoader({
            hostname: 'http://l.dns.porn:9282',
            pathname: '/user',
            name: 'user',
        });


        client.createPOSTBody = () => {
            return 'not event relevant';
        };

        const server = express();
        
        server.post('/user', async(request, response) => {
            response
                .status(200)
                .set('content-type', 'text/xml')
                .end(`
<Soap:Envelope xmlns:Soap="http://schemas.xmlsoap.org/soap/envelope/">
  <Soap:Body>
    <ReadMultiple_Result xmlns="urn:microsoft-dynamics-schemas/test">
      <ReadMultiple_Result>
        <Joinbox_Address_Relations>
          <Key>56</Key>
        </Joinbox_Address_Relations>
      </ReadMultiple_Result>
    </ReadMultiple_Result>
  </Soap:Body>
</Soap:Envelope>
                    `);
        });

        const serverInstance = server.listen(9282);


        const data = await client.load();

        assert.equal(data['ReadMultiple_Result']['ReadMultiple_Result']['Joinbox_Address_Relations']['Key'], 56);

        serverInstance.close();

        await section.wait(10);
    });
});