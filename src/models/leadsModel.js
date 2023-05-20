const mongoose = require('mongoose');

const leadsSchema = new mongoose.Schema({
    employeeId: {
        type: Number
    },
    userName:{
        type: String
    },
    assignTo: {
        type: String
    },
    status: {
        type: String,
        default: "Allocated"
    },
    work: {
        type: String,
        default: "Not Updated"
    },
    label: {
        type: String,
        default: "Hot"
    },
    reminder: {
        type: Date,
        default: null
    },
    logs: {
        type: Array,
        default: null
    },
    tasks: {
        type: []
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('leads', leadsSchema);