require('./config/config');

const _ = require('lodash');
const express = require("express");
const bodyParser = require("body-parser");

var {mongoose} = require('./db/mongoose');
var {Event} = require('./models/Event');
var {User} = require('./models/User');
var {authenticate} = require('./middleware/authenticate');
const {ObjectID} = require("mongodb");

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/event',(req,res)=>{
    var event = new Event({
        name: req.body.name,
        type: req.body.type,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        location: req.body.location,
        maxMembers: req.body.maxMembers,
        description: req.body.description,
        // _creator: req.user._id,
        // _members: req.user._id
    });

    event.save().then((doc)=>{
        res.send(doc);
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.get('/events',authenticate, (req,res)=>{
    Event.find({_creator:req.user._id}).then((events)=>{
        res.send({events});
    }).catch((e)=>{
        res.send(400).send();
    });
});

app.get('/event/:id',authenticate,(req,res)=>{
    var id = req.params.id;
    Event.findOne({
        _id:id,
        _creator:req.user._id
    }).then((event)=>{
        if(!event){
            return res.status(404).send();
        }
        res.send(event);
    }).catch((e)=>{
        res.status(404).send(e);
    });
});

app.patch('/event/:id', authenticate, (req,res)=>{
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
        _id:id,
        _creator: req.user._id
    },{$set:body},{new:true}).then((event)=>{
        if(!event){
            return res.status(404).send();
        }
        res.send(event);
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

app.delete('/event/:id', authenticate, (req,res)=>{
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

app.post('/user',(req,res)=>{
    var body = _.pick(req.body,['email','password','username']);
    var user = new User(body);

    user.save().then(()=>{
        return user.generateAuthToken();
    }).then((token)=>{
        res.header('x-auth',token).send(user);
    }).catch((e)=>{
        res.status(400).send(e);
    });
});

app.post('/sampleuser',(req,res)=>{
    var body = _.pick(req.body,['email','password','username']);
    var user = new User(body);

    user.save().then(()=>{
       res.send(user);
    }).catch((e)=>{
        res.status(400).send(e);
    });
})

app.get('/users/me', authenticate, (req,res)=>{
    res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req,res)=>{
    req.user.removeToken(req.token).then(()=>{
        res.status(200).send();
    }, ()=>{
        res.status(400).send();
    });
});

app.post('/users/login', (req, res)=>{
    var body = _.pick(req.body, ['email','password']);

    User.findByCredentials(body.email, body.password).then((user)=>{
        return user.generateAuthToken().then((token)=>{
            res.header('x-auth', token).send(user);
        });
    }).catch((e)=>{
        res.status(400).send(e)
    });
});

app.patch('/users/me/token', authenticate, (req,res)=>{
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

    // user.save().then(()=>{
    //     res.send(user);
    // }).catch((e)=>{
    //     res.status(400).send(e);
    // });
});

app.listen(port, ()=>{
    console.log(`Started on port ${port}`);
});

module.exports = {app};
