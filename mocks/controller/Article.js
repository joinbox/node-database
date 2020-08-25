

export default class UserController {



    async list(request, response) {
        response.status(200)
            .set('content-type', 'application/json')
            .send(JSON.stringify([{
                id: 1,
                title: 'Some news about something interesting',
            }]));
    }




    setup(server) {
        server.get('/article', (request, response) => {
            this.list(request, response);
        });
    }
}