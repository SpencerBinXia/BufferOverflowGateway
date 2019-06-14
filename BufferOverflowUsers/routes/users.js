var express = require('express');
var router = express.Router();
var nodeMailer = require('nodemailer');
var User = require('../schemas/UserSchema').User;

//nodemailer Object for email verification
var smtpTransport = nodeMailer.createTransport({
    host: 'buffer-users1',
    port: 25,
    tls:
        {
            rejectUnauthorized: false
        }
});

//Random key generation algorithm
function genKey()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 13; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/* POST add new user. */
router.post('/adduser', function(req, res, next) {
    var status;
    var regInfo = req.body;
    var regKey = genKey();
    var userDoc = new User({username: regInfo.username, password: regInfo.password, email: regInfo.email, reputation: 1, active: false, key: regKey});
    userDoc.save(function (err) {
        if (err) {
            res.status(400).send({status: "error", error: "save user in database failed"});
            return;
        }
    });

    var mailOptions = {
        to: regInfo.email,
        subject: "validation key",
        html: 'validation key: <' + regKey + '>'
    };

    smtpTransport.sendMail(mailOptions, function(error, response){
        if (error){
            status = {'status': "error", 'error': "send mail failed"};
            res.status(400).send(status);
            return;
        }
        else{
            status = {'status': "OK"};
            res.status(200).send(status);
        }
    });
});

/* POST login. */
router.post('/login', function(req, res, next)  {
    var logInfo = req.body;
    var logQuery = {
        $and: [
            {username: logInfo.username},
            {password: logInfo.password},
            {active: true}
        ]
    };
    var loginQuery = User.findOne(logQuery, function (err, foundUser) {
        if (err || !foundUser){
            res.status(400).send({status: "error", error: "Login user failed"});
            return;
        }
        else
        {
            res.status(200).send({status: "OK"});
        }
    });
});

/* POST logout. */
router.post('/logout', function(req, res, next)  {
    res.send({status: "OK"});
});

/* POST verify. */
router.post('/verify', function(req, res, next) {
    var verifyInfo = req.body;
    if (verifyInfo.key === "abracadabra")
    {
        var verQuery = {email: verifyInfo.email};
        User.findOneAndUpdate(verQuery, {active: true}, function (err, result) {
            if (err || !result){
                res.status(400).send({status: "error", error: "Verify user failed"});
                return;
            }
            else
            {
                res.status(200).send({status: "OK"});
            }
        });
    }
    else
    {
        var verQuery = {
            $and: [
                {email: verifyInfo.email},
                {key: verifyInfo.key}
            ]
        };
        User.findOneAndUpdate(verQuery, {active: true}, function (err, result) {
            if (err || !result) {
                res.status(400).send({status: "error", error: "Set user to active in database failed"});
                return;
            }
            else
            {
                res.status(200).send({status: "OK"});
            }
        });
    }
});

/* POST get user. */
router.get('/getuser', function (req, res, next) {
   var getUser = req.body;
    User.findOne({username: getUser.username}, function (err, result) {
        if (err || !result){
            res.status(400).send({status: "error", error: err});
            return;
        }
        else
        {
            res.status(200).send({status: "OK", user: {email: result.email, reputation: result.reputation}});
        }
    });
});

/* POST change user reputation. */
router.post('/upvote', function (req, res, next) {
    var userInfo = req.body;
    if (userInfo.score < 0)
    {
        User.findOne({username: userInfo.userid}, function (err, result)
        {
            if (err || !result) {
                res.status(400).send({status: "error", error: err});
                return;
            }
            else if (result.reputation == 1) {
                res.status(200).send({status: "OK"});
                return;
            }
            else {
                User.findOneAndUpdate({username: userInfo.userid}, {$inc: {reputation: -1}}, function (err, result) {
                    if (err || !result) {
                        res.status(400).send({status: "error", error: err});
                        return;
                    }
                    res.status(200).send({status: "OK"});
                    return;
                });
            }
        });
    }
    else if (userInfo.score > 0)
    {
        User.findOne({username: userInfo.userid}, function (err, result)
        {
            if (err || !result) {
                res.status(400).send({status: "error", error: err});
                return;
            }
            else {
                User.findOneAndUpdate({username: userInfo.userid}, {$inc: {reputation: 1}}, function (err, result) {
                    if (err || !result) {
                        res.status(400).send({status: "error", error: err});
                        return;
                    }
                    res.status(200).send({status: "OK"});
                    return;
                });
            }
        });
    }
});

module.exports = router;
