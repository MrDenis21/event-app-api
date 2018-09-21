require('./config/config');

const _ = require('lodash');
const express = require("express");
const bodyParser = require("body-parser");
const AWS = require('aws-sdk');

const BUCKET_NAME = '';
const IAM_USER_KEY = '';
const IAM_USER_SECRET = '';

var {mongoose} = require('./db/mongoose');
var {Event} = require('./models/Event');
var {User} = require('./models/User');
var {authenticate} = require('./middleware/authenticate');
const {ObjectID} = require("mongodb");
var fs = require("fs");

var app = express();

app.use(bodyParser.json());

const port = process.env.PORT;

app.post('/api/event', authenticate, (req,res)=>{
    var event = new Event({
        name: req.body.name,
        type: req.body.type,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        maxMembers: req.body.maxMembers,
        description: req.body.description,
        _creator: req.user._id,
        _members: req.user._id
    });

    event.save().then((doc)=>{
        res.send(doc);
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.get('/api/events/my',authenticate, (req,res)=>{
    Event.find({_creator:req.user._id}).then((events)=>{
        res.send({events});
    }).catch((e)=>{
        res.send(400).send(e);
    });
});

app.get('/api/events/all', (req,res)=>{
    Event.find({}).then((events)=>{
        res.send({events});
    }).catch((e)=>{
        res.send(400).send(e);
    });
});

app.get('/api/events/taking-part',authenticate,(req,res)=>{
    Event.find({_members:req.user._id}).then((events)=>{
        res.send({events});
    }).catch((e)=>{
        res.send(400).send(e);
    });
});

app.get('/api/event/:id',(req,res)=>{
    var id = req.params.id;
    Event.findOne({
        _id:id
        // _creator:req.user._id
    }).then((event)=>{
        if(!event){
            return res.status(404).send();
        }
        res.send(event);
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

app.patch('/api/event/:id', authenticate, (req,res)=>{
    var id = req.params.id;
    var body = _.pick(req.body, ["name","type","startDate","endDate","location","maxMembers","description","_members"])
    // console.log(body);
    var nowDate =  new Date(new Date().getTime());

    if(!ObjectID.isValid(id)){
        return res.status(400).send("Invalid object id");
    }

    if((new Date(body.endDate) < nowDate)||((new Date(body.endDate) > nowDate)&&(new Date(body.startDate) <nowDate))){
        return res.status(400).send("You can't edit finished/continuing event");
    } 

    Event.findOneAndUpdate({
        _id:id
    },{$set:body},{new:true}).then((event)=>{
        if(!event){
            return res.status(404).send("bitsh");
        }
        res.send(event);
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

app.delete('/api/event/:id', authenticate, (req,res)=>{
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(400).send("Invalid object id");
    }

    Event.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then((event)=>{
        if(!event){
            return res.status(404).send("Event is not found to delete");
        }
        res.send({event});
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

app.post('/api/user',(req,res)=>{
    var body = _.pick(req.body,['email','password','username']);
    var user = new User(body);

    user.save().then(()=>{
        return user.generateAuthToken();
    }).then((token)=>{
        res.header('x-auth',token).send(token);
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

app.get('/api/users/me', authenticate, (req,res)=>{
    res.send(req.user);
});

app.delete('/api/users/me/token', authenticate, (req,res)=>{
    req.user.removeToken(req.token).then(()=>{
        res.status(200).send();
    }, ()=>{
        res.status(400).send();
    });
});

app.post('/api/users/login', (req, res)=>{
    var body = _.pick(req.body, ['email','password']);

    User.findByCredentials(body.email, body.password).then((user)=>{
        return user.generateAuthToken().then((token)=>{
            res.header('x-auth', token).send(user);
        });
    }).catch((e)=>{
        res.status(400).send(e)
    });
});

app.patch('/api/users/me/token', authenticate, (req,res)=>{
    var body = _.pick(req.body,["email","password","username"]);
    User.findOneAndUpdate({
        'tokens': {
            $elemMatch: {
                token: req.token
            }
        }
    },{$set:body},{new:true}).then((user)=>{
        if(!user){
            return res.status(404).send();
        }
        res.send(body);
    }).catch((e)=>{
        res.status(400).send(e);
    });

});


app.listen(port, ()=>{
    console.log(`Started on port ${port}`);
});

module.exports = {app};
