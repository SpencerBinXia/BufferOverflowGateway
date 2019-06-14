var   mongoose = require('mongoose')
    , mongoosastic = require('mongoosastic')
    , Schema = mongoose.Schema;

var QuesSchema = new Schema({
    id: {type: String, unique: true},
    user: {username: String, reputation: Number},
    title: String,
    body: String,
    score: Number,
    view_count: Number,
    answer_count: Number,
    timestamp: Number,
    media: [{type: String}],
    tags: [{type: String}],
    accepted_answer_id: String,
    viewers: [{type: String}],
    upvoters: [{type: String}],
    downvoters: [{type: String}]
});

QuesSchema.plugin(mongoosastic, {
    esClient: global.client
});

//QuesSchema.index({ title: 'text', body: 'text'},{default_language: "none"}, {background: "false"});

exports.Question = mongoose.model('Question', QuesSchema);