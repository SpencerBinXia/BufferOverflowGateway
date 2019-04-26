var express = require('express');
var router = express.Router();
const request = require('request');
var cassandra = require('cassandra-driver');
const sid = require('shortid');
var multer = require('multer');
var upload = multer();

const client = new cassandra.Client({
    contactPoints: ['152.44.32.121'],
    localDataCenter: 'datacenter1',
    keyspace: 'media'
});

client.connect(function (err) {
    if (err)
        console.log(err);
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Buffer Overflow', name: req.session.username});
});

router.post('/adduser', function(req, res, next) {
    request.post({url:'http://152.44.33.24:5000/adduser', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post('/login', function(req, res, next) {
    request.post({url:'http://152.44.33.24:5000/login', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                req.session.username = req.body.username;
                res.status(200).send(result);
            }
        }
    });
});

router.post('/logout', function(req, res, next) {
    if (req.session.username == undefined)
    {
        res.status(400).send({status: "error", error: "Can't logout with no user in session"});
        return;
    }
    request.post({url:'http://152.44.33.24:5000/logout', form:req.body}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
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
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.get('/user/:username', function(req, res, next) {
    var getUser = req.body;
    getUser.username = req.params.username;
    var headersOpt = {
        "content-type": "application/json"
    };
    request.get({headers: headersOpt, url:'http://152.44.33.24:5000/getuser', form: getUser}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

/* QUESTIONS */

router.get('/user/:username/questions', function(req, res, next) {
    var getUser = req.body;
    getUser.username = req.params.username;
    var headersOpt = {
        "content-type": "application/json"
    };
    request.get({headers: headersOpt, url:'http://152.44.33.64:6000/user/questions', form: getUser}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.get('/user/:username/answers', function(req, res, next) {
    var getUser = req.body;
    getUser.username = req.params.username;
    var headersOpt = {
        "content-type": "application/json"
    };
    request.get({headers: headersOpt, url:'http://152.44.33.64:6000/user/answers', form: getUser}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post('/questions/add', function(req, res, next) {
    if (req.session.username == undefined)
    {
        res.status(400).send({status: "error", error: "Can't add question with no logged in user"});
        return;
    }
    var quesFields = req.body;
    quesFields.username = req.session.username;
   // console.log(quesFields.username);
    //console.log(quesFields.tags);
    //console.log(quesFields.media);
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
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
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
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.delete('/questions/:id', function(req, res, next) {
    var delQues = req.body;
    delQues.id = req.params.id;
    if (req.session.username === undefined)
    {
        res.status(400).send({status: "error", error: "No logged in user"});
        return;
    }
    else
    {
        delQues.userid = req.session.username;
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.delete({headers: headersOpt, url:'http://152.44.33.64:6000/questions/delete', form: delQues}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            if (JSON.parse(APIres.body).status === "error")
            {
                res.status(400).send(JSON.parse(APIres.body));
                return;
            }
            else
            {
                var mediaJSON = JSON.parse(APIres.body);
                console.log(mediaJSON);
                console.log(mediaJSON.medialist);
                /*
                for (var i = 0;i < mediaJSON.medialist.length;i++)
                {
                    var deleteQuery = "DELETE FROM media WHERE mediaID='" + mediaJSON.medialist[i] + "'";
                    client.execute(deleteQuery, function (err, result){
                        if (err){
                            res.status(400).send({status: "error", error: err});
                        }
                    });
                }*/
                var truncateQuery = "TRUNCATE media;";
                client.execute(truncateQuery, function (err){
                    if (err){
                        res.status(400).send({status: "error", error: err});
                    }
                    res.status(200).send({status: "OK"});
                    return;
                });
            }
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
    if (req.body.media != undefined)
    {
        ansFields.media = JSON.stringify(req.body.media);
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/answers/add', form: ansFields}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.get('/questions/:id/answers', function(req, res, next) {
    var getAns = req.body;
    getAns.id = req.params.id;
    request.get({url:'http://152.44.33.64:6000/answers/get', form: getAns}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post('/search', function(req, res, next) {
    var searchInfo = req.body;
    //console.log(searchInfo.limit);
    //console.log(searchInfo.timestamp);
    if (searchInfo.limit == undefined)
    {
        searchInfo.limit = 25;
    }
    if (searchInfo.limit > 100)
    {
        res.status(400).send({status: "error", error: "search limit cannot be greater than 100"});
        return;
    }
    if (searchInfo.sort_by == undefined)
    {
        searchInfo.sort_by = 'score';
    }
    if (searchInfo.tags != undefined)
    {
        searchInfo.tags = JSON.stringify(searchInfo.tags);
    }
    console.log(searchInfo.limit);
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/search', form: searchInfo}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post('/questions/:id/upvote', function(req, res, next) {
    if (req.session.username == undefined || req.session.username == null)
    {
        res.send({status: "error", error: "Can't upvote with no logged in user"});
        return;
    }
    var quesUpFields = req.body;
    console.log(req.body);
    console.log(quesUpFields);
    console.log(quesUpFields.upvote);
    quesUpFields.userid = req.session.username;
    quesUpFields.id = req.params.id;
    console.log(quesUpFields.upvote);
    if (quesUpFields.upvote == undefined)
    {
        quesUpFields.upvote = true;
    }
    console.log(quesUpFields.upvote);
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/questions/upvote', form: quesUpFields}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
           // console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post('/answers/:id/upvote', function(req, res, next) {
    if (req.session.username == undefined || req.session.username == null)
    {
        res.send({status: "error", error: "Can't upvote with no logged in user"});
        return;
    }
    var ansUpFields = req.body;
    ansUpFields.userid = req.session.username;
    ansUpFields.id = req.params.id;
    if (ansUpFields.upvote == undefined)
    {
        ansUpFields.upvote = true;
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/answers/upvote', form: ansUpFields}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
           // console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post("/answers/:id/accept", function (req, res, next){
    if (req.session.username == undefined || req.session.username == null)
    {
        res.send({status: "error", error: "Can't accept answer with no logged in user"});
        return;
    }
    var ansAccFields = req.body;
    ansAccFields.userid = req.session.username;
    ansAccFields.id = req.params.id;
    var headersOpt = {
        "content-type": "application/json"
    };
    request.post({headers: headersOpt, url:'http://152.44.33.64:6000/answers/accept', form: ansAccFields}, function(err, APIres, body){
        if (err)
        {
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
           // console.log(JSON.parse(APIres.body));
            var result = JSON.parse(APIres.body);
            if (result.status == "error")
            {
                res.status(400).send({status: "error", error: result.error});
            }
            else
            {
                res.status(200).send(result);
            }
        }
    });
});

router.post("/addmedia", upload.single('content'), function (req, res, next){
    if (req.session.username == undefined || req.session.username == null)
    {
        res.send({status: "error", error: "Can't add media with no logged in user"});
        return;
    }
    var headersOpt = {
        "content-type": "application/json"
    };
    var contentType = req.headers['content-type'];
   // console.log(contentType);
    var mediaID = req.session.username + "media" + sid.generate();
    var mediaJSON = {mediaID: mediaID, username: req.session.username};
    var insertQuery = "INSERT INTO media (mediaID, content) VALUES (?,?)";
    var insertParams = [mediaID, req.file.buffer];
    client.execute(insertQuery, insertParams, { prepare: true }, function (err) {
        if (err){
           // console.log(err);
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            //Inserted in the cluster
            request.post({headers: headersOpt, url:'http://152.44.33.64:6000/indexMedia', form: mediaJSON}, function(err, APIres, body){
                if (err)
                {
                    res.status(400).send({status: "error", error: err});
                    return;
                }
                else
                {
                  //  console.log(JSON.parse(APIres.body));
                    res.status(200).send(JSON.parse(APIres.body));
                }
            });
        }
    });
});

router.get("/media/:id", function (req, res, next){
    var selectQuery = "SELECT * FROM media WHERE mediaID='" + req.params.id + "'";
    client.execute(selectQuery, function (err, result){
        if (err){
            res.status(400).send({status: "error", error: err});
            return;
        }
        else if (!result)
        {
            res.status(400).send({status: "error", error: "No media found"});
            return;
        }
        else
        {
            try {
                res.status(200).send({status: "OK", content: result.rows[0].contents});
            }
            catch (e) {
                res.status(400).send({status: "error", error: "cassandra get error (async likely)"});
            }
        }
    });
});
module.exports = router;
