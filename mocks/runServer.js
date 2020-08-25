import Server from './Server.js';
import RainbowConfig from '@rainbow-industries/rainbow-config';
import path from 'path';



(async() => {
    const server = new Server();
    const mainDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../');
    const config = new RainbowConfig(path.join(mainDir, './config'), mainDir);

    await config.load();
    await server.load();
    await server.listen(config.get('mock.server.port'));

    return server;
})().then((server) => {
    console.log(`The Mock-Server is running on port ${server.getPort()}`);
}).catch(console.log);