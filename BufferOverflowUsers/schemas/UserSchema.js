var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');


//Mongoose User Schema
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {type: String, unique: true},
    password: String,
    email: {type: String, unique: true},
    reputation: Number,
    active: Boolean,
    key: String
});

UserSchema.plugin(uniqueValidator);

exports.User = mongoose.model('User', UserSchema);