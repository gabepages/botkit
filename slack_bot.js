/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


controller.hears(['hello', 'hi', 'sup', 'yo', 'hey'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
            bot.reply(message, 'What can I do for you?');
        } else {
            bot.startConversation(message, function(err, convo){
              if (!err) {
                  convo.say('Hello! I do not know your name yet!');
                  convo.ask('What should I call you?', function(response, convo) {
                      convo.ask('You want me to call you `' + response.text + '`?', [
                          {
                              pattern: bot.utterances.yes,
                              callback: function(response, convo) {
                                  // since no further messages are queued after this,
                                  // the conversation will end naturally with status == 'completed'
                                  convo.next();
                              }
                          },
                          {
                              pattern: bot.utterances.no,
                              callback: function(response, convo) {
                                  // stop the conversation. this will cause it to end with status == 'stopped'
                                  convo.stop();
                              }
                          },
                          {
                              default: true,
                              callback: function(response, convo) {
                                  convo.repeat();
                                  convo.next();
                              }
                          }
                      ]);

                      convo.next();

                  }, {'key': 'nickname'}); // store the results in a field called nickname

                  convo.on('end', function(convo) {
                      if (convo.status == 'completed') {
                          bot.reply(message, 'OK! Let me write that down...');

                          controller.storage.users.get(message.user, function(err, user) {
                              if (!user) {
                                  user = {
                                      id: message.user,
                                  };
                              }
                              user.name = convo.extractResponse('nickname');
                              controller.storage.users.save(user, function(err, id) {
                                  bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                              });
                          });



                      } else {
                          // this happens if the conversation ended prematurely for some reason
                          bot.reply(message, 'OK, nevermind!');
                      }
                  });
              }
            });
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('Hello! I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: bot.utterances.yes,
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: bot.utterances.no,
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! Let me write that down...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],'direct_message,direct_mention,mention', function(bot, message) {
        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

controller.hears(['ask (.*) to play ping pong'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    var newName = name.slice(2, -1);

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'OK! Give me a minute to see if you have any takers.');
            bot.startPrivateConversation({user: newName}, function(err, privateConvo){
              privateConvo.ask("Do you want to play :ping: with " + user.name + "?", [
                  {
                    pattern: bot.utterances.yes,
                    callback: function(response,convo) {
                      convo.say('Awesome, I will let ' + user.name + ' know, have fun!');
                      bot.startPrivateConversation({user: user.id}, function(err, privateConvo){
                        privateConvo.say('Your friend is ready to play some :ping:. *Im rooting for you!*! :wink:');
                      })
                      convo.next();
                    }
                  },
                  {
                    pattern: bot.utterances.no,
                    callback: function(response,convo) {
                      convo.say("No worries, I'll be sure to let " + user.name + " down easy.");
                      bot.startPrivateConversation({user: user.id}, function(err, privateConvo){
                        privateConvo.say("Your friend is a little busy at the moment and can't play, sorry bud... :disappointed_relieved:");
                      });
                      convo.next();
                    }
                  },
                  {
                    default: true,
                    callback: function(response,convo) {
                      // just repeat the question
                      convo.repeat();
                      convo.next();
                    }
                  }
              ]);
            });
        }else {
          bot.startConversation(message, function(err, convo) {
              if (!err) {
                  convo.say("Hey! I do not know your name yet! I can't ask someone to play ping pong with you if I dont know who you are!");
                  convo.ask('What should I call you?', function(response, convo) {
                      convo.ask('You want me to call you `' + response.text + '`?', [
                          {
                              pattern: bot.utterances.yes,
                              callback: function(response, convo) {
                                  // since no further messages are queued after this,
                                  // the conversation will end naturally with status == 'completed'
                                  convo.next();
                              }
                          },
                          {
                              pattern: bot.utterances.no,
                              callback: function(response, convo) {
                                  // stop the conversation. this will cause it to end with status == 'stopped'
                                  convo.stop();
                              }
                          },
                          {
                              default: true,
                              callback: function(response, convo) {
                                  convo.repeat();
                                  convo.next();
                              }
                          }
                      ]);

                      convo.next();

                  }, {'key': 'nickname'}); // store the results in a field called nickname

                  convo.on('end', function(convo) {
                      if (convo.status == 'completed') {
                          bot.reply(message, 'OK! Let me write that down...');

                          controller.storage.users.get(message.user, function(err, user) {
                              if (!user) {
                                  user = {
                                      id: message.user,
                                  };
                              }
                              user.name = convo.extractResponse('nickname');
                              controller.storage.users.save(user, function(err, id) {
                                  bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on and I will send your ping pong request');
                                  bot.startPrivateConversation({user: newName}, function(err, privateConvo){
                                    privateConvo.ask("Do you want to play :ping: with " + user.name + "?", [
                                        {
                                          pattern: bot.utterances.yes,
                                          callback: function(response,convo) {
                                            convo.say('Awesome, I will let ' + user.name + ' know, have fun!');
                                            bot.startPrivateConversation({user: user.id}, function(err, privateConvo){
                                              privateConvo.say('Your friend is ready to play some :ping:. *Im rooting for you!*! :wink:');
                                            })
                                            convo.next();
                                          }
                                        },
                                        {
                                          pattern: bot.utterances.no,
                                          callback: function(response,convo) {
                                            convo.say("No worries, I'll be sure to let " + user.name + " down easy.");
                                            bot.startPrivateConversation({user: user.id}, function(err, privateConvo){
                                              privateConvo.say("Your friend is a little busy at the moment and can't play, sorry bud... :disappointed_relieved:");
                                            })
                                            convo.next();
                                          }
                                        },
                                        {
                                          default: true,
                                          callback: function(response,convo) {
                                            // just repeat the question
                                            convo.repeat();
                                            convo.next();
                                          }
                                        }
                                    ]);
                                  });
                              });
                          });



                      } else {
                          // this happens if the conversation ended prematurely for some reason
                          bot.reply(message, 'OK, nevermind!');
                      }
                  });
              }
          })
        }
    });
});

controller.hears(['weather', 'weather report'],'direct_message,direct_mention,mention', function(bot, message){
  var request = require('request');
  request('http://api.openweathermap.org/data/2.5/weather?zip=33609&APPID=3bce0babfe679d7492b4d03dbf2bfcf5&units=imperial', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          var data = JSON.parse(body);
          bot.reply(message, {
              "attachments": [
                  {
                      "fallback": "Local Weather Report",
                      "color": "#0055aa",
                      "pretext": "Heres the local weather report:",
                      "author_name": "Click below for more info",
                      "title": "Open Weather Map",
                      "title_link": "https://weather.com/weather/radar/interactive/l/USFL0050:1:US?animation=true&layer=radarConus&zoom=8",
                      "fields": [
                          {
                              "title": "Status:",
                              "value": data.weather[0].description,
                              "short": false
                          },
          				 {
                              "title": "Temp:",
                              "value": data.main.temp + " F",
                              "short": false
                          },
          				 {
                              "title": "Cloudiness:",
                              "value": data.clouds.all + "%",
                              "short": false
                          }
                      ],
                      "footer": "OpenWeatherMap API",
                      "footer_icon": "http://static.apkthing.com/uploads/posts/2016-04/1461809311_open-weather-map-provideropen-weather-map-providerv.png",
                      "ts": Date.now() / 1000
                  }
              ]
          });

       }else{
         bot.reply(message, "ERROR: " + error);
       }
  });
} );


function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
