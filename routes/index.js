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
            res.send(JSON.parse(APIres.body));
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
            res.send(JSON.parse(APIres.body));
        }
        else
        {
            req.session.username = req.body.username;
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/logout', function(req, res, next) {
    request.post({url:'http://localhost:5000/logout', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send(JSON.parse(APIres.body));
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
            res.send(JSON.parse(APIres.body));
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/questions/add', function(req, res, next) {
    request.post({url:'quesserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("add questions failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.get('/questions/{id}', function(req, res, next) {
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

router.post('/questions/{id}/answers/add', function(req, res, next) {
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

router.get('/questions/{id}/answers', function(req, res, next) {
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
