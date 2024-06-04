const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    itemno: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 
    },
    price: {
        type: Number,
        required: true
    }
});

const resaSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: false,
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
    },
    pax: {
        type: Number,
        required: true
    },
    phoneno: {
        type: Number,
        required: true,
    },
    other: {
        type: String,
        required: false,
    },
    takeout: {
        type: Boolean,
        required: true,
    },
    orders: [orderItemSchema] // Array of order items
});  

module.exports = mongoose.model('Resa', resaSchema);