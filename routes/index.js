var express = require('express');
var router = express.Router();
const request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buffer Overflow'});
});

router.post('/adduser', function(req, res, next) {
    request.post({url:'http://152.44.33.24:5000/adduser', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/login', function(req, res, next) {
    request.post({url:'http://152.44.33.24:5000/login', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
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
        res.send({status: "error", error: "Can't logout with no user in session"});
        return;
    }
    request.post({url:'http://152.44.33.24:5000/logout', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
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
    request.post({url:'http://152.44.33.24:5000/verify', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
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
        res.send({status: "error", error: "Can't add question with no logged in user"});
        return;
    }
    var quesFields = req.body;
    quesFields.username = req.session.username;
    console.log(quesFields.username);
    console.log(quesFields.tags);
    console.log(quesFields.media);
    if (req.body.tags != undefined)
    {
        quesFields.tags = JSON.stringify(req.body.tags);
    }
    if (req.body.media != undefined)
    {
        quesFields.media = JSON.stringify(req.body.media);
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/questions/add', form: quesFields}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.get('/questions/:id', function(req, res, next) {
    var getQues = req.body;
    getQues.id = req.params.id;
    if (req.session.username == undefined)
    {
        getQues.userid = req.ip;
    }
    else
    {
        getQues.userid = req.session.username;
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.get({headers: headersOpt, url:'http://152.44.33.64:6000/questions/get', form: getQues}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            console.log(JSON.parse(APIres.body));
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/questions/:id/answers/add', function(req, res, next) {
    if (req.session.username == undefined || req.session.username == null)
    {
        res.send({status: "error", error: "Can't add answer with no logged in user"});
        return;
    }
    var ansFields = req.body;
    ansFields.username = req.session.username;
    ansFields.id = req.params.id;
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/answers/add', form: ansFields}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            console.log(JSON.parse(APIres.body));
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.get('/questions/:id/answers', function(req, res, next) {
    var getAns = req.body;
    getAns.id = req.params.id;
    request.get({url:'http://152.44.33.64:6000/answers/get', form: getAns}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

router.post('/search', function(req, res, next) {
    var searchInfo = req.body;
    if (searchInfo.limit == undefined)
    {
        searchInfo.limit = 25;
    }
    if (searchInfo.limit > 100)
    {
        res.send({status: "error", error: "search limit cannot be greater than 100"});
        return;
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/search', form: searchInfo}, function(err, APIres, body){
        if (err)
        {
            res.send({status: "error", error: err});
            return;
        }
        else
        {
            res.send(JSON.parse(APIres.body));
        }
    });
});

module.exports = router;
