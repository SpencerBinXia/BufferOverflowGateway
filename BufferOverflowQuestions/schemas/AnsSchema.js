var   mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var AnsSchema = new Schema({
    id: {type: String, unique: true},
    question: String,
    username: String,
    body: String,
    score: Number,
    is_accepted: Boolean,
    media: [{type: String}],
    upvoters: [{type: String}],
    downvoters: [{type: String}]
});

exports.Answer = mongoose.model('Answer', AnsSchema);