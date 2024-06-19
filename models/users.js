const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    "username": {
        type: String,
        required: true,
        unique: true
    },
    "password": {
        type: String,
        required: true
    },
    "token": {
        type: String,
    },
    "fname": {
        type: String,
        required: true
    },
    "lname": {
        type: String,
        required: true
    },
    "email": {
        type: String,
        required: true
    },
    "phoneno": {
        type: Number,
        required: true
    },
    "role": {
        type: String,
        required: true
    }
});  

module.exports = mongoose.model('User', userSchema);
