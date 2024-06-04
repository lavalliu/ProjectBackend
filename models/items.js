const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

const itemSchema = new mongoose.Schema({
    "itemno": {
        type: Number,
        unique: true,
        required: true
    },
    "itemname": {
        type: String,
        required: true,
        unique: true
    },
    "group": {
        type: String,
        required: true
    },
    "description": {
        type: String,
        required: false
    },
    "price": {
        type: Number,
        required: true
    },
    "status": {
        type: Boolean,
        required: true
    }
});  

// Apply the autoIncrement plugin to itemSchema.
itemSchema.plugin(autoIncrement.plugin, {
    model: 'Item', // The model to configure
    field: 'itemno', // The field to auto-increment
    startAt: 1, // The number the count should start at
    incrementBy: 1 // The number by which to increment the count each time
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

