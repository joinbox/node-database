

export default class UserController {



    async list(request, response) {
        response.status(200)
            .set('content-type', 'application/json')
            .send(JSON.stringify([{
                id: 1,
            }]));
    }




    setup(server) {
        server.get('/mailConfig', (request, response) => {
            this.list(request, response);
        });
    }
}