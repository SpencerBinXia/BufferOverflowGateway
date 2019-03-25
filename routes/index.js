var express = require('express');
var router = express.Router();
const request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buffer Overflow'});
});

router.post('/adduser', function(req, res, next) {
    request.post({url:'usersserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("adduser failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.post('/login', function(req, res, next) {
    request.post({url:'usersserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("login failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.post('/logout', function(req, res, next) {
    request.post({url:'usersserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("logout failed");
        }
        else
        {
            console.log("status: " + httpResponse);
        }
    });
});

router.post('/verify', function(req, res, next) {
    request.post({url:'usersserv', form:req.body}, function(err, httpResponse, body){
        if (err)
        {
            console.log("verify failed");
        }
        else
        {
            console.log("status: " + httpResponse);
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
