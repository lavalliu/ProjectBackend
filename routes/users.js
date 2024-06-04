const users = require('../controllers/users');

const routes=[
    {
        method: 'POST',
        url: '/users/login',
        handler: users.login
    },
    {
        method: 'POST',
        url: '/users/register',
        handler: users.register
    },  

]

module.exports=routes;