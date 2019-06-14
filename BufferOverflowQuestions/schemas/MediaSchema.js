var   mongoose = require('mongoose')
    , Schema = mongoose.Schema;


//Mongoose Media Schema

var MediaSchema = new Schema({
    id: {type: String, unique: true},
    question: String,
    user: String
});

exports.Media = mongoose.model('Media', MediaSchema);