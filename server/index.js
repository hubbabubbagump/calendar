'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Mockgoose = require('mockgoose').Mockgoose;
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const uuidv4 = require('uuid/v4');

const app = express();
const port = 8080;
const mockDatabase = true;
const cookie_key = 'calendar_email_username';

const dbAddr = "mockAddr";
const dbName = "dbName";
const Schema = mongoose.Schema;

var User = null;
var CalendarEvent = null;

app.use(bodyParser.json());
app.use(cookieParser());

//////////////////
// MONGODB SCHEMAS
//////////////////

const Users = new Schema({
   uuid: String,
   email: String,
   password: String,
   cookie: Boolean,
   events: [{type: String}]
});

const Events = new Schema({
   uuid: String,
   user: String,
   title: String,
   location: String,
   date: Date
});

//////////////////
// MOCKGOOSE AND DB FUNCTIONS
//////////////////

if (mockDatabase) {
   var mockgoose = new Mockgoose(mongoose);
   mockgoose.prepareStorage().then(function() {
      const addr = `monogodb://${dbAddr}/${dbName}`;
      mongoose.connect(addr);
      mongoose.connection.once('open', () => {
         console.log(`MongoDB connected at ${addr}`);
         User = mongoose.model('users', Users);
         CalendarEvent = mongoose.model('events', Events);

         addUser('test@test.com', 'test');
      });
      mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
   });
}
else {
   const addr = `monogodb://${dbAddr}/${dbName}`;
   mongoose.connect(addr);
   mongoose.connection.once('open', () => {
      console.log(`MongoDB connected at ${addr}`);
      User = mongoose.model('users', Users);
      CalendarEvent = mongoose.model('events', Events);
   });
   mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
}

function addUser(email, password, callback) {
   if (User && email && password) {
      User.find({ email: email }, function(err, users) {
         if (err) {
            console.error(err);
            if (typeof callback == "function") {
               callback(err, false);
            }
         }
         else if (users.length <= 0) {
            bcrypt.hash(password, 10, function(err, hash) {
               if (err) return console.log(err);
               let user = new User({ uuid: uuidv4(), email: email, password: hash, cookie: false, events: [] });
               user.save(function (err, user) {
                  if (err) return console.error(err);
                  console.log(`[User] Added with id ${user.uuid}`);
                  if (typeof callback == "function") {
                     callback(null, true);
                  }
               });
            });
         }
         else {
            if (typeof callback == "function") {
               callback("User already exists", true);
            }
         }
      });
   }
   else {
      console.error('[Error] Unable to add user to model');
   }
}

function authenticateUser(email, password, callback) {
   if (User && email && password) {
      var query = User.where({email: email});
      query.findOne(function (err, user) {
         if (err) {
            console.error(err);
            callback(false);
         }
         
         if (user) {
            bcrypt.compare(password, user.password, function(err, res) {
               if (res) {
                  console.log(`[User] Validated user '${email}'`);
                  callback(true, user);
               }
               else {
                  console.error(err);
                  callback(false);
               }
            });
            return;
         }

         console.error('[Error] Unable to find user');
         callback(false);
      })
   }
   else {
      console.error('[Error] Invalid authentication credentials');
      callback(false);
   }
}

function addEvent(email, title, date, location, callback) {
   if (User && CalendarEvent) {
      User.where({email: email}).findOne(function (err, user) {
         if (err) {
            console.error(err);
            callback("Unable to find user", null);
         }
         else {
            let ev = new CalendarEvent({uuid: uuidv4(), user: user.uuid, title: title, date: date, location: location});
            ev.save(function (error, e) {
               if (err) {
                  console.error(error);
                  callback("Unable to save event", null);
               }
               else {
                  user.events.push(e.uuid);
                  user.markModified("events");
                  user.save(function (userErr, _) {
                     if (userErr) {
                        callback("Unable to update user", null);
                     }
                     else {
                        console.log(`[User] Event for ${email} added with id ${e.uuid}`);
                        callback(null, e);
                     }
                  });
               }
            });
         }
      });
   } 
   else {
      console.error("[Error] Request to database while down");
      res.status(500).send("Database is down");
   }
}

function getEvents(email, callback) {
   if (User && CalendarEvent) {
      User.where({ email: email }).findOne(function (err, user) {
         if (err) {
            console.error(err);
            callback("Unable to find user", null);
         }
         else if (user) {
            console.log(`[User] For user ${email} fetching events ${user.events}`);
            CalendarEvent.find({ user: user.uuid }, 'title location date', function (err, events) {
               if (err) {
                  console.error(err);
                  callback(`Unable to find events by user ${email}`, null);
               }
               else {
                  callback(null, events);
               }
            });
         }
         else {
            callback("Null user", null);
         }
      });
   }
}

//////////////////
// SERVER
//////////////////

app.get('/api/check_status', (req, res) => {
   if (req.cookies && req.cookies[cookie_key]) {
      res.send({cookie_set: true});
   }
   else {
      res.send({cookie_set: false});
   }
});

app.post('/api/register', (req, res) => {
   if (!req) res.status(500).send("Malformed request");

   const body = req.body;
   if (body) {
      const email = body.email;
      const password = body.password;
      const set_cookie = body.setCookie;
      if (!email || !password || !email.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/)) {
         res.status(500).send("Invalid credentials");
      }
      else {
         addUser(email, password, function(err, success) {
            if (err) {
               if (success) {
                  res.send({ registered: false });
               }
               else {
                  res.status(500).send({ error: err, registered: false });
               }
            }
            else {
               if (set_cookie) {
                  res.cookie(cookie_key, email, {
                     expires: new Date(Date.now() + 1 * 1000 * 60 * 60 * 24 * 365)
                  });
                  console.log(`[Log] Cookie set for user ${email}`);
               }

               res.send({ registered: true })
            }
         });
      }
   }
});

app.post('/api/login', (req, res) => {
   if (!req) res.status(500).send("Malformed request");

   const body = req.body;
   if (body) {
      const email = body.email;
      const password = body.password;
      const set_cookie = body.setCookie;

      if (!email || !password || !email.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/)) {
         res.status(500).send("Invalid credentials");
      }
      else {
         authenticateUser(email, password, function(isValid, user=null) {
            console.log(`[Log] User ${email} has logged on`);
            if (isValid && set_cookie) {
               res.cookie(cookie_key, email, {
                  expires: new Date(Date.now() + 1 * 1000 * 60 * 60 * 24 * 365)
               });
               console.log(`[Log] Cookie set for user ${email}`);
               User.where({uuid: user.uuid}).updateOne({ cookie: false });
            }
            else if (isValid) {
               res.cookie(cookie_key, email);
            }

            res.send({ isValid: isValid });
         });
      }
   }
   else {
      res.status(500).send("Invalid credentials");
   }
});

app.get('/api/logout', (req, res) => {
   if (!req) res.status(500).send("Malformed request");
   
   const cookies = req.cookies;
   if (User && cookies) {
      if (!cookies[cookie_key]) {
         res.send("No Cookie");
         return;
      }
      console.log(`[Log] User ${cookies[cookie_key]} has logged off`);
      User.where({ email: cookies[cookie_key] }).update({ cookie: false });
      res.clearCookie(cookie_key);
      res.send("OK");
   }
   else {
      res.status(500).send("Malformed request");
   }
});

app.post('/api/addEvent', (req, res) => {
   const title = req.query.title;
   const date = req.query.date;
   const location = req.query.location;

   if (req.cookies[cookie_key]) {
      addEvent(req.cookies[cookie_key], title, date, location, function(err, e) {
         if (err) {
            console.error(err);
            res.status(500).send(err);
         }
         else {
            res.send(JSON.stringify(e));
         }
      });
   }
   else {
      res.status(500).send("Missing credentials");
   }
});

app.get('/api/getEvents', (req, res) => {
   if (!req.cookies[cookie_key]) {
      res.status(500).send("Missing credentials");
   }
   else {
      getEvents(req.cookies[cookie_key], function(err, eventList) {
         if (err) {
            console.error(err);
            res.status(500).send(err);
         }
         else {
            res.send(JSON.stringify(eventList));
         }
      });
   }
});

app.listen(port, 'localhost', () => console.log(`Listening on port ${port}`));
