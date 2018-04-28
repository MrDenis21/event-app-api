var mongoose = require("mongoose");

var EventSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        minlength: 3,
        maxlength: 100
    },
    type: {
        type: String,
        required:true,
        minlength: 3,
        maxlength: 100
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    maxMembers: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        maxlength: 300
    },
    image:{
        data:Buffer,
        contentType: String
    }
    // _creator: {
    //     required:true,
    //     type: mongoose.Schema.Types.ObjectId
    // },

    // _members: {
    //     required:true,
    //     type: mongoose.Schema.Types.ObjectId
    // }
});

var Event = mongoose.model('Event',EventSchema);

module.exports = {Event};