const express = require('express');
const router = express.Router();
const sid = require('shortid');
const moment = require('moment');
const Question = require('../schemas/QuesSchema').Question;
const Answer = require('../schemas/AnsSchema').Answer;
const Media = require('../schemas/MediaSchema').Media;
var mongoose = require('mongoose');
var mongoosastic=require("mongoosastic");
var request = require('request');
const HashMap = require('hashmap');
var async = require("async");

var mediaMap = new HashMap();
var mediaUserMap = new HashMap();

/* POST question. */
router.post('/questions/add', async(req, res, next) => {
    var tagArray = undefined;
    var mediaArray = undefined;
    var quesInfo = req.body;
    var quesId = quesInfo.username + sid.generate();

    if (quesInfo.tags != undefined)
    {
        tagArray = JSON.parse(quesInfo.tags);
    }
    if (quesInfo.media != undefined)
    {
        mediaArray = JSON.parse(quesInfo.media);
        for (var i = 0;i < mediaArray.length;i++)
        {
            try
            {
                let result = await Media.findOne({id: mediaArray[i]});
                if (!result)
                {
                    console.log("media doesnt exist");
                    res.status(400).send({status: "error", error: "media doesnt exist"});
                    return;
                }
                else if (result.user != quesInfo.username)
                {
                    console.log("adding someone elses media");
                    res.status(400).send({status: "error", error: "Attempting to add someone else's media"});
                    return;
                }
                else if (result.question != undefined)
                {
                    console.log("media already associated");
                    res.status(400).send({status: "error", error: "Media is already associated"});
                    return;
                }
            }
            catch (err)
            {
                console.log("add ques media await error");
                res.status(400).send({status: "error", error: err});
                return;            }
        }
    }
    if (quesInfo.title === undefined || quesInfo.body === undefined)
    {
        res.status(400).send({status: "error", error: "undefined data in add question"});
        return;
    }
    var quesDoc = new Question({id: quesId, user: {username: quesInfo.username, reputation: 1}, title: quesInfo.title,
                                  body: quesInfo.body, score: 0, view_count: 0, answer_count: 0, timestamp: moment().unix(),
                                  media: mediaArray, tags: tagArray, accepted_answer_id: undefined, viewers: undefined, upvoters: undefined, downvoters: undefined});
    quesDoc.save(async (err) => {
        if (err) {
            //console.log(err);
            res.status(400).send({status: "error", error: err});
            return;
        }
        if (mediaArray != undefined)
        {
            for (var i = 0;i < mediaArray.length; i++) {
                try
                {
                    let result = await Media.findOneAndUpdate({id: mediaArray[i]}, {$set: {question: quesId}});
                }
                catch (err)
                {
                    res.status(400).send({status: "error", id: err});
                    return;
                }
            }
        }
        quesDoc.on('es-indexed', function(err, res){
            if (err) throw err;
            /* Document is indexed */
        });
        res.send({status: "OK", id: quesId});
        return;
    });
});


/* GET question id. */
router.get('/questions/get', function(req, res, next) {
    var getQues = req.body;
    Question.findOne({id: getQues.id}, function (err, result) {
        if (err || !result) {
            res.status(400).send({status: "error", error: "Question not found"});
            return;
        }
        Question.findOne({id: getQues.id, viewers: getQues.userid}, function (err, result) {
            if (err) {
                res.status(400).send({status: "error", error: "Get question look for viewers error"});
                return;
            }
            else if (result) {
                res.send({status: "OK", question: {
                        id: result.id,
                        user: {username: result.user.username, reputation: result.user.reputation},
                        title: result.title,
                        body: result.body,
                        score: result.score,
                        view_count: result.view_count,
                        answer_count: result.answer_count,
                        timestamp: result.timestamp,
                        media: result.media,
                        tags: result.tags,
                        accepted_answer_id: result.accepted_answer_id
                    }});
                return;
            }
            else if (!result) {
                Question.findOneAndUpdate({id: getQues.id}, {$inc: {view_count: 1}, $push: {viewers: getQues.userid}}, {new: true}, function (err, result) {
                    if (err) {
                        res.status(400).send({status: "error", error: "Add new viewer in get questions error"});
                        return;
                    }
                    res.send({status: "OK", question: {
                        id: result.id,
                        user: {username: result.user.username, reputation: result.user.reputation},
                        title: result.title,
                        body: result.body,
                        score: result.score,
                        view_count: result.view_count,
                        answer_count: result.answer_count,
                        timestamp: result.timestamp,
                        media: result.media,
                        tags: result.tags,
                        accepted_answer_id: result.accepted_answer_id
                        }});
                });
            }
        });
    });
});

/* DELETE question id. */
router.delete('/questions/delete', function(req, res, next) {
    var delQues = req.body;
    var mediaArray;
    Question.findOne({id: delQues.id, 'user.username' : delQues.userid}, function (err, result) {
        if (err || !result) {
            res.status(400).send({status: "error", error: "Invalid question delete"});
            return;
        }
        if (result.media != undefined)
        {
            mediaArray = result.media;
        }
        result.remove();
        Answer.find({question: req.body.id}, function (err, foundAns) {
            if (err){
                res.status(400).send({status: "error", error: "Get answers failed"});
                return;
            }
            else
            {
                if (foundAns != null)
                {
                    foundAns.forEach(function (ans) {
                        if (ans.media != undefined) {
                            mediaArray.concat(ans.media);
                        }
                        ans.remove();
                    });
                }
                res.send({medialist: mediaArray});
            }
        });
    });
});

/* POST answer. */
router.post('/answers/add', async(req, res, next) => {
    var status;
    var ansInfo = req.body;
    var ansMediaArray = undefined;
    if (ansInfo.media != undefined)
    {
        ansMediaArray = JSON.parse(ansInfo.media);
        for (var i = 0;i < ansMediaArray.length;i++)
        {
            try
            {
                let result = await Media.findOne({id: mediaArray[i]});
                if (!result)
                {
                    res.status(400).send({status: "error", error: "media doesnt exist"});
                    return;
                }
                else if (result.user != ansInfo.username)
                {
                    res.status(400).send({status: "error", error: "Attempting to add someone else's media"});
                    return;
                }
                else if (result.question != undefined)
                {
                    res.status(400).send({status: "error", error: "Media is already associated"});
                    return;
                }
            }
            catch (err)
            {
                res.status(400).send({status: "error", error: err});
                return;            }
        }
    }
    if (ansInfo.body === undefined || ansInfo.id === undefined)
    {
        res.status(400).send({status: "error", error: "undefined data in add answer"});
        return;
    }
    var ansId = ansInfo.id + ansInfo.username + sid.generate();
    var ansDoc = new Answer({id: ansId, question: ansInfo.id, username: ansInfo.username,
                              body: ansInfo.body, score: 0, is_accepted: false, answer_count: 0, timestamp: moment().unix(),
                              media: ansMediaArray, upvoters: undefined, downvoters: undefined});
    ansDoc.save(function (err) {
        if (err) {
            //console.log(err);
            res.status(400).send({status: "error", error: "save answer in database failed"});
            return;
        }
            Question.findOneAndUpdate({id: ansInfo.id}, {$inc: {answer_count: 1}}, async (err, result) => {
                if (err || !result) {
                    res.status(400).send({status: "error", error: "Update question after adding answer failed"});
                    return;
                }
                if (ansMediaArray != undefined)
                {
                    if (mediaArray != undefined)
                    {
                        for (var i = 0;i < ansMediaArray.length; i++) {
                            try
                            {
                                let result = await Media.findOneAndUpdate({id: ansMediaArray[i]}, {$set: {question: ansId}});
                            }
                            catch (err)
                            {
                                res.status(400).send({status: "error", id: err});
                                return;
                            }
                        }
                    }
                }
                res.send({status: "OK", id: ansId});
            });
    });
});

/* GET answers of question. */
router.get('/answers/get', function(req, res, next) {
    Answer.find({question: req.body.id}, function (err, foundAns) {
        if (err){
            res.status(400).send({status: "error", error: "Get answers failed"});
            return;
        }
        else
        {
            var answerlist = [];
            foundAns.forEach(function(ans){
                var ansJSON = {id: ans.id, user: ans.username, body: ans.body, score: ans.score, is_accepted: ans.is_accepted, timestamp: ans.timestamp, media: ans.media};
                answerlist.push(ansJSON);
            });
            res.send({status: "OK", answers: answerlist});
        }
        });
});

/* GET user's questions. */
router.get('/user/questions', function(req, res, next) {
    Question.find({'user.username': req.body.username}, function (err, foundQues) {
        if (err){
            //console.log(err);
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var quesidlist = [];
            foundQues.forEach(function(ques){
                //console.log(ques);
                quesidlist.push(ques.id);
            });
            res.send({status: "OK", questions: quesidlist});
        }
    });
});

/* GET user's answers. */
router.get('/user/answers', function(req, res, next) {
    Answer.find({username: req.body.username}, function (err, foundAns) {
        if (err){
            res.status(400).send({status: "error", error: "Get user's answers failed"});
            return;
        }
        else
        {
            var answerlist = [];
            foundAns.forEach(function(ans){
                //console.log(ans);
                answerlist.push(ans.id);
            });
            res.send({status: "OK", answers: answerlist});
        }
    });
});

/* POST search. */
router.post('/search', function(req, res, next) {
    var searchInfo = req.body;
    var tagString = "";
    if (searchInfo.timestamp == undefined) {
        searchInfo.timestamp = moment().unix();
    }
    if (searchInfo.tags != undefined) {
        searchTagsArray = JSON.parse(searchInfo.tags);
        for (var i = 0;i < searchTagsArray.length;i++)
        {
            tagString = tagString + " " + searchTagsArray[i];
        }
    }
    var sortby = searchInfo.sort_by + ":desc";
    var sortJSON;
    if (searchInfo.sort_by == 'score') {
        sortJSON = {score: -1};
    }
    else if (searchInfo.sort_by == 'timestamp') {
        sortJSON = {timestamp: -1};
    }
    try {
        if (searchInfo.q != undefined && searchInfo.q != null && searchInfo.q != " " && searchInfo.q != "") {
            if (!searchInfo.has_media && !searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: {
                                multi_match: {
                                    query: searchInfo.q,
                                    fields: ['title^2', 'body']
                                }
                            },
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (searchInfo.has_media && !searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (!searchInfo.has_media && searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (searchInfo.has_media && searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (!searchInfo.has_media && !searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (searchInfo.has_media && !searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (!searchInfo.has_media && searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (searchInfo.has_media && searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: searchInfo.q,
                                        fields: ['title^2', 'body']
                                    }
                                },
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
        }
        else {
            if (!searchInfo.has_media && !searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues.hits.hits);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (searchInfo.has_media && !searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: {
                                exists: {
                                    "field": "media"
                                }
                            },
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (!searchInfo.has_media && searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: {
                                exists: {
                                    "field": "accepted_answer_id"
                                }
                            },
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            else if (searchInfo.has_media && searchInfo.accepted && searchInfo.tags == undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (!searchInfo.has_media && !searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: {
                                match: {
                                    "tags": {
                                        "query": tagString,
                                        "operator": "and"
                                    }
                                }
                            },
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (searchInfo.has_media && !searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        foundQues.hits.hits.forEach(function (ques) {
                            if (ques != undefined) {
                                var quesJSON = {
                                    id: ques.id,
                                    user: {username: ques.user.username, reputation: ques.user.reputation},
                                    title: ques.title,
                                    body: ques.body,
                                    score: ques.score,
                                    view_count: ques.view_count,
                                    answer_count: ques.answer_count,
                                    timestamp: ques.timestamp,
                                    media: ques.media,
                                    tags: ques.tags,
                                    accepted_answer_id: ques.accepted_answer_id
                                };
                                queslist.push(quesJSON);
                            }
                        });
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (!searchInfo.has_media && searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
            if (searchInfo.has_media && searchInfo.accepted && searchInfo.tags != undefined) {
                Question.search({
                        bool: {
                            must: [
                                {
                                    match: {
                                        "tags": {
                                            "query": tagString,
                                            "operator": "and"
                                        }
                                    }
                                },
                                {
                                    exists: {
                                        "field": "media"
                                    }
                                },
                                {
                                    exists: {
                                        "field": "accepted_answer_id"
                                    }
                                }
                            ],
                            filter: {
                                range: {"timestamp": {"lte": searchInfo.timestamp}}
                            }
                        }
                    },
                    {
                        from: 0,
                        size: searchInfo.limit,
                        sort: sortby,
                        hydrate: true
                    },
                    function (err, foundQues) {
                        //console.log("search " + foundQues);
                        var queslist = [];
                        if (foundQues != undefined) {
                            foundQues.hits.hits.forEach(function (ques) {
                                if (ques != undefined) {
                                    var quesJSON = {
                                        id: ques.id,
                                        user: {username: ques.user.username, reputation: ques.user.reputation},
                                        title: ques.title,
                                        body: ques.body,
                                        score: ques.score,
                                        view_count: ques.view_count,
                                        answer_count: ques.answer_count,
                                        timestamp: ques.timestamp,
                                        media: ques.media,
                                        tags: ques.tags,
                                        accepted_answer_id: ques.accepted_answer_id
                                    };
                                    queslist.push(quesJSON);
                                }
                            });
                        }
                        res.send({status: "OK", questions: queslist});
                        return;
                    });
            }
        }
    }
    catch (err)
    {
        console.log("search failed");
        res.send({status: "error", error: "search failed"});
        return;
    }
});

/* Upvote question. */
router.post('/questions/upvote', function(req, res, next) {
    var upInfo = req.body;

    var headersOpt = {
        "content-type": "application/json"
    };

    var userInfo = {userid: undefined, upvote: undefined, score: 0};
    userInfo.upvote = upInfo.upvote;

    if (upInfo.upvote == "true") {
        Question.findOne({id: upInfo.id}, function (err, result) {
            if (err || !result) {
                res.status(400).send({status: "error", error: "Question not found"});
                return;
            }
            userInfo.userid = result.user.username;
            Question.findOne({id: upInfo.id, upvoters: upInfo.userid}, function (err, result) {
                if (err) {
                    res.status(400).send({status: "error", error: "Get question look for upvoters error"});
                    return;
                }
                else if (result) {
                    Question.findOneAndUpdate({id: upInfo.id}, {
                        $inc: {score: -1},
                        $pull: {upvoters: upInfo.userid}
                    }, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({
                                status: "error",
                                error: "Decrement upvote due to existing upvote error"
                            });
                            return;
                        }
                        userInfo.score=-1;
                        request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                            if (err)
                            {
                                res.status(400).send({status: "error", error: err});
                                return;
                            }
                            else
                            {
                                res.send(JSON.parse(APIres.body));
                                return;
                            }
                        });
                    });
                }
                else if (!result) {
                    Question.findOneAndUpdate({id: upInfo.id}, {
                        $inc: {score: 1},
                        $push: {upvoters: upInfo.userid}
                    }, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({status: "error", error: "Upvote question error"});
                            return;
                        }
                        Question.findOne({id: upInfo.id, downvoters: upInfo.userid}, function (err, result) {
                            if (err) {
                                res.status(400).send({status: "error", error: "Find downvoter after upvote error"});
                                return;
                            }
                            if (result)
                            {
                                Question.findOneAndUpdate({id: upInfo.id}, {$inc: {score: 1}, $pull: {downvoters: upInfo.userid}}, {new: true}, function (err, result) {
                                    if (err) {
                                        res.status(400).send({status: "error", error: "Pull upvote question error"});
                                        return;
                                    }
                                    userInfo.score=2;
                                    request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                        if (err)
                                        {
                                            res.status(400).send({status: "error", error: err});
                                            return;
                                        }
                                        else
                                        {
                                            res.send(JSON.parse(APIres.body));
                                            return;
                                        }
                                    });
                                });
                            }
                            else
                            {
                                userInfo.score=1;
                                request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                    if (err)
                                    {
                                        res.status(400).send({status: "error", error: err});
                                        return;
                                    }
                                    else
                                    {
                                        res.send(JSON.parse(APIres.body));
                                        return;
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    }
    else if (upInfo.upvote == "false")
        {
            Question.findOne({id: upInfo.id}, function (err, result) {
                if (err || !result) {
                    res.status(400).send({status: "error", error: "Question not found"});
                    return;
                }
                userInfo.userid = result.user.username;
                Question.findOne({id: upInfo.id, downvoters: upInfo.userid}, function (err, result) {
                    if (err) {
                        res.status(400).send({status: "error", error: "Get question look for downvoters error"});
                        return;
                    }
                    else if (result) {
                        Question.findOneAndUpdate({id: upInfo.id}, {
                            $inc: {score: 1},
                            $pull: {downvoters: upInfo.userid}
                        }, {new: true}, function (err, result) {
                            if (err) {
                                res.status(400).send({
                                    status: "error",
                                    error: "Increment downvote due to existing downvote error"
                                });
                                return;
                            }
                            userInfo.score=1;
                            request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                if (err)
                                {
                                    res.status(400).send({status: "error", error: err});
                                    return;
                                }
                                else
                                {
                                    //console.log(JSON.parse(APIres.body));
                                    res.send(JSON.parse(APIres.body));
                                    return;
                                }
                            });
                        });
                    }
                    else if (!result) {
                        Question.findOneAndUpdate({id: upInfo.id}, {$inc: {score: -1}, $push: {downvoters: upInfo.userid}}, {new: true}, function (err, result) {
                            if (err) {
                                res.status(400).send({status: "error", error: "Downvote question error"});
                                return;
                            }
                            Question.findOne({id: upInfo.id, upvoters: upInfo.userid}, function (err, result) {
                                if (err) {
                                    res.status(400).send({status: "error", error: "Find upvoter after downvote error"});
                                    return;
                                }
                                if (result)
                                {
                                    Question.findOneAndUpdate({id: upInfo.id}, {$inc: {score: -1}, $pull: {upvoters: upInfo.userid}}, {new: true}, function (err, result) {
                                        if (err) {
                                            res.status(400).send({status: "error", error: "Pull downvote question error"});
                                            return;
                                        }
                                        userInfo.score=-2;
                                        request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                            if (err)
                                            {
                                                res.status(400).send({status: "error", error: err});
                                                return;
                                            }
                                            else
                                            {
                                                res.send(JSON.parse(APIres.body));
                                                return;
                                            }
                                        });
                                    });
                                }
                                else
                                {
                                    userInfo.score=-1;
                                    request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                        if (err)
                                        {
                                            res.status(400).send({status: "error", error: err});
                                            return;
                                        }
                                        else
                                        {
                                            res.send(JSON.parse(APIres.body));
                                            return;
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
    }
});

/* Upvote answer. */
router.post('/answers/upvote', function(req, res, next) {
    var upInfo = req.body;

    var headersOpt = {
        "content-type": "application/json"
    };

    var userInfo = {userid: undefined, upvote: undefined, score: 0};
    userInfo.upvote = upInfo.upvote;

    if (upInfo.upvote == "true") {
        Answer.findOne({id: upInfo.id}, function (err, result) {
            if (err || !result) {
                res.status(400).send({status: "error", error: err});
                return;
            }
            userInfo.userid = result.username;
            Answer.findOne({id: upInfo.id, upvoters: upInfo.userid}, function (err, result) {
                if (err) {
                    res.status(400).send({status: "error", error: err});
                    return;
                }
                else if (result) {
                    Answer.findOneAndUpdate({id: upInfo.id}, {
                        $inc: {score: -1},
                        $pull: {upvoters: upInfo.userid}
                    }, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({
                                status: "error",
                                error: err
                            });
                            return;
                        }
                        userInfo.score=-1;
                        request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                            if (err)
                            {
                                res.status(400).send({status: "error", error: err});
                                return;
                            }
                            else
                            {
                               // console.log(JSON.parse(APIres.body));
                                res.send(JSON.parse(APIres.body));
                                return;
                            }
                        });
                    });
                }
                else if (!result) {
                    Answer.findOneAndUpdate({id: upInfo.id}, {
                        $inc: {score: 1},
                        $push: {upvoters: upInfo.userid}
                    }, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({status: "error", error: err});
                            return;
                        }
                        Answer.findOne({id: upInfo.id, downvoters: upInfo.userid}, function (err, result) {
                            if (err) {
                                res.status(400).send({status: "error", error: err});
                                return;
                            }
                            if (result)
                            {
                                Answer.findOneAndUpdate({id: upInfo.id}, {$inc: {score: 1}, $pull: {downvoters: upInfo.userid}}, {new: true}, function (err, result) {
                                    if (err) {
                                        res.status(400).send({status: "error", error: err});
                                        return;
                                    }
                                    userInfo.score=2;
                                    request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                        if (err)
                                        {
                                            res.status(400).send({status: "error", error: err});
                                            return;
                                        }
                                        else
                                        {
                                            res.send(JSON.parse(APIres.body));
                                            return;
                                        }
                                    });
                                });
                            }
                            else
                            {
                                userInfo.score=1;
                                request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                    if (err)
                                    {
                                        res.status(400).send({status: "error", error: err});
                                        return;
                                    }
                                    else
                                    {
                                       // console.log(JSON.parse(APIres.body));
                                        res.send(JSON.parse(APIres.body));
                                        return;
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    }
    else if (upInfo.upvote == "false")
    {
        Answer.findOne({id: upInfo.id}, function (err, result) {
            if (err || !result) {
                res.status(400).send({status: "error", error: "Question not found"});
                return;
            }
            userInfo.userid = result.username;
            Answer.findOne({id: upInfo.id, downvoters: upInfo.userid}, function (err, result) {
                if (err) {
                    res.status(400).send({status: "error", error: err});
                    return;
                }
                else if (result) {
                    Answer.findOneAndUpdate({id: upInfo.id}, {
                        $inc: {score: 1},
                        $pull: {downvoters: upInfo.userid}
                    }, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({
                                status: "error",
                                error: err
                            });
                            return;
                        }
                        userInfo.score=1;
                        request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                            if (err)
                            {
                                res.status(400).send({status: "error", error: err});
                                return;
                            }
                            else
                            {
                              //  console.log(JSON.parse(APIres.body));
                                res.send(JSON.parse(APIres.body));
                                return;
                            }
                        });
                    });
                }
                else if (!result) {
                    Answer.findOneAndUpdate({id: upInfo.id}, {$inc: {score: -1}, $push: {downvoters: upInfo.userid}}, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({status: "error", error: err});
                            return;
                        }
                        Answer.findOne({id: upInfo.id, upvoters: upInfo.userid}, function (err, result) {
                            if (err) {
                                res.status(400).send({status: "error", error: err});
                                return;
                            }
                            if (result)
                            {
                                Answer.findOneAndUpdate({id: upInfo.id}, {$inc: {score: -1}, $pull: {upvoters: upInfo.userid}}, {new: true}, function (err, result) {
                                    if (err) {
                                        res.status(400).send({status: "error", error: err});
                                        return;
                                    }
                                    userInfo.score=-2;
                                    request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                        if (err)
                                        {
                                            res.status(400).send({status: "error", error: err});
                                            return;
                                        }
                                        else
                                        {
                                            res.send(JSON.parse(APIres.body));
                                            return;
                                        }
                                    });
                                });
                            }
                            else
                            {
                                userInfo.score=-1;
                                request.post({headers: headersOpt, url:'http://209.50.54.182:5000/upvote', form: userInfo}, function(err, APIres, body){
                                    if (err)
                                    {
                                        res.status(400).send({status: "error", error: err});
                                        return;
                                    }
                                    else
                                    {
                                        res.send(JSON.parse(APIres.body));
                                        return;
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    }
});

/* POST accept answer. */
router.post('/answers/accept', function(req, res, next) {
    req.body;
    Answer.findOne({id: req.body.id}, function (err, result) {
        if (err || !result) {
            res.status(400).send({status: "error", error: "Answer to be accepted not found"});
            return;
        }
        Question.findOne({id: result.question, 'user.username': req.body.userid}, function (err, result) {
            if (err) {
                res.status(400).send({status: "error", error: err});
                return;
            }
            else if (!result) {
                res.status(400).send({status: "error", error: "User accepting answer is not poser of question"});
                return;
            }
            else if (result.accepted_answer_id != undefined)
            {
                res.status(400).send({status: "error", error: "Question already has accepted answer"});
                return;
            }
            else {
                Answer.findOneAndUpdate({id: req.body.id}, {$set: {is_accepted: true}}, {new: true}, function (err, result) {
                    if (err || !result) {
                        res.status(400).send({status: "error", error: "Error when setting found answer"});
                        return;
                    }
                    Question.findOneAndUpdate({id: result.question},{$set: {accepted_answer_id: req.body.id}}, {new: true}, function (err, result) {
                        if (err) {
                            res.status(400).send({status: "error", error: err});
                            return;
                        }
                        res.status(200).send({status: "OK"});
                        return;
                    });
                });
            }
        });
    });
});

/* POST indexing Cassandra media. */
router.post("/indexMedia", function (req, res, next){
    var mediaDoc = new Media({id: req.body.mediaID, question: undefined, user: req.body.username});
    mediaDoc.save(function (err) {
        if (err) {
            //console.log(err);
            res.status(400).send({status: "error", error: err});
            return;
        }
        res.status(200).send({status: "OK", id: req.body.mediaID});
        return;
    });
});

module.exports = router;
