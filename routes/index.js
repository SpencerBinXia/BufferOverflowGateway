var express = require('express');
var router = express.Router();
const request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buffer Overflow'});
});

router.post('/adduser', function(req, res, next) {
    request.post({url:'http://localhost:5000/adduser', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "ERROR", error: "API request failed"});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/login', function(req, res, next) {
    request.post({url:'http://localhost:5000/login', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "ERROR", error: "API request failed"});
            return;
        }
        else
        {
            req.session.username = req.body.username;
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/logout', function(req, res, next) {
    if (req.session.username == undefined)
    {
        res.send({status: "ERROR", error: "Can't logout with no user in session"});
        return;
    }
    request.post({url:'http://localhost:5000/logout', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "ERROR", error: "API request failed"});
            return;
        }
        else
        {
            req.session.username = undefined;
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/verify', function(req, res, next) {
    request.post({url:'http://localhost:5000/verify', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "ERROR", error: "API request failed"});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/questions/add', function(req, res, next) {
    if (req.session.username == undefined)
    {
        res.send({status: "ERROR", error: "Can't add question with no logged in user"});
        return;
    }
    var quesFields = req.body;
    quesFields.username = req.session.username;
    console.log(quesFields.username);
    console.log(quesFields.tags);
    quesFields.tags = JSON.stringify(req.body.tags);
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://localhost:6000/questions/add', form: quesFields}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "ERROR", error: "API request failed"});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.get('/questions/:id', function(req, res, next) {
    request.post({url:'quesserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("get question failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.post('/questions/:id/answers/add', function(req, res, next) {
    request.post({url:'quesserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("add ques answer failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.get('/questions/:id/answers', function(req, res, next) {
    request.post({url:'quesserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("get ques answers failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.post('/search', function(req, res, next) {
    request.post({url:'quesserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("search failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

module.exports = router;
