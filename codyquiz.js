#!/usr/bin/env node

var config = require("./config.js");
var utility = require("./utility.js");
var async = require("async");

//=========================================================
// Bot Setup
//=========================================================

var restify = require("restify");
var builder = require("botbuilder");

// Setup Restify Server
var server = restify.createServer({
    name: "CodyQuiz"
});
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log("%s listening to %s", server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.microsoftAppId,
    appPassword: config.microsoftAppPassword
});
var bot = new builder.UniversalBot(connector);
server.post("/codyquiz/api/messages", connector.listen());

//=========================================================
// Database setup
//=========================================================

var mysql = require("mysql");
var dbpool = mysql.createPool({
    connectionLimit:    10,
    host:               config.mysqlHost,
    user:               config.mysqlUser,
    password:           config.mysqlPassword,
    database:           config.mysqlDatabase
});

//=========================================================
// Install middleware
//=========================================================

bot.use({
    botbuilder: function(session, next) {
        console.log("Incoming message: %s", JSON.stringify(session.message));
        console.log("Locale %s", session.preferredLocale());

        // Register and update user
        dbpool.getConnection(function(err, connection) {
            if(err) throw err;

            async.seq(
                function(message, callback) {
                    connection.query("SELECT `id` FROM `identities` WHERE `connector_source` = ? AND `connector_user_id` = ?", [
                        session.message.source,
                        session.message.user.id
                    ], function(err, result, fields) {
                        if(err) callback(err, null);

                        if(result.length >= 1) {
                            callback(null, result[0].id);
                        }
                        else {
                            callback(null, null);
                        }
                    });
                },
                function(identity, callback) {
                    if(identity != null) {
                        connection.query("UPDATE `identities` SET `connector_address` = ?, `last_access_on` = NOW() WHERE `id` = ?", [
                            JSON.stringify(session.message.address),
                            identity
                        ], function(err, result, field) {
                            callback(err, identity);
                        });
                    }
                    else {
                        connection.query("INSERT INTO `identities` (`id`, `connector_source`, `connector_user_id`, `connector_address`, `first_seen_on`, `last_access_on`) VALUES(DEFAULT, ?, ?, ?, NOW(), NOW())", [
                            session.message.source,
                            session.message.user.id,
                            JSON.stringify(session.message.address)
                        ], function(err, result, field) {
                            callback(err, result.insertId);
                        });
                    }
                }
            )(session.message, function(err, result) {
                connection.release();

                if(err) throw err;

                session.identity = result;
                console.log("User identity #%d", result);

                next();
            });
        });
    } //end user identity middleware
});

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog("/", [
    function (session, args, next) {
        session.beginDialog("/quiz");
    }
]);

bot.dialog("/quiz", [
    function (session) {
        dbpool.getConnection(function(err, connection) {
            if(err) throw err;

            async.seq(
                function(connection, callback) {
                    connection.query("SELECT q.`quiz_id`, q.`answer_type`, q.`image_path`, q.`answer`, q.`choice_json`, t.`text`, t.`locale`, IF(t.`locale` = ?, 2, IF(t.`locale` = ?, 1, 0)) AS `score` FROM `quizzes` AS q LEFT OUTER JOIN `quiz_texts` AS t ON q.`quiz_id` = t.`quiz_id` WHERE q.`quiz_id` NOT IN (SELECT `quiz_id` FROM `quiz_answers` WHERE `user_id` = ?) ORDER BY `score` DESC, RAND() LIMIT 1", [
                        session.preferredLocale(),
                        "en", // default locale
                        session.identity
                    ], function(err, result, fields) {
                        if(err) callback(err, null);
                        callback(null, result);
                    });
                },
                function(result, callback) {
                    if(result.length >= 1) {
                        var quiz = result[0];

                        session.dialogData.currentQuizId = quiz.quiz_id;
                        session.dialogData.currentQuizAnswer = quiz.answer;
                        console.log("User #%d gets quiz #%d assigned (answer %s)", session.identity, quiz.quiz_id, quiz.answer);
                        session.save();

                        if(quiz.image_path) {
                            var msg = new builder.Message(session)
                                .addAttachment(
                                    new builder.HeroCard(session)
                                        .images([
                                            builder.CardImage.create(session, config.riddleImageBasePath + quiz.image_path)
                                        ])
                                );
                            session.send(msg);

                            /*session.send(new builder.Message(session).addAttachment({
                                contentType: "image/png",
                                contentUrl: config.riddleImageBasePath + quiz.image_path
                            }));*/
                        }

                        switch(quiz.answer_type) {
                            case "general":
                            default:
                                builder.Prompts.text(session, quiz.text, {
                                    retryPrompt: "retryText"
                                });
                                break;

                            case "number":
                                builder.Prompts.number(session, quiz.text, {
                                    retryPrompt: "retryNumber"
                                });
                                break;

                            case "confirm":
                                builder.Prompts.confirm(session, quiz.text, {
                                    retryPrompt: "retryConfirm"
                                });
                                break;

                            case "choice":
                                builder.Prompts.choice(session, quiz.text, JSON.parse(quiz.choice_json), {
                                    maxRetries: 0
                                });
                                break;
                        }
                    }
                    else {
                        session.send("no_more_quizzes");
                    }

                    callback(null, null);
                }
            )(connection, function(err, result) {
                connection.release();
                if(err) throw err;
            });
        });
    },
    function(session, result) {
        console.log("Raw user response: %s", JSON.stringify(result.response));

        var userResponse = utility.extractAnswer(result.response);
        console.log("Quiz #%d, user response '%s', correct answer is '%s'", session.dialogData.currentQuizId, userResponse, session.dialogData.currentQuizAnswer);

        var correct = (userResponse == session.dialogData.currentQuizAnswer);
        session.send((correct) ? "answer_correct" : "answer_wrong");

        dbpool.getConnection(function(err, connection) {
            if(err) throw err;

            connection.query("INSERT INTO `quiz_answers` (`user_id`, `quiz_id`, `provided_answer`, `answered_on`, `is_correct`) VALUES(?, ?, ?, NOW(), ?)", [
                session.identity,
                session.dialogData.currentQuizId,
                userResponse,
                correct
            ], function(err, result, fields) {
                connection.release();
                if(err) throw err;

                session.conversationData.currentQuizId = null;
                session.conversationData.currentQuizAnswer = null;
                session.save();

                builder.Prompts.text(session, "another_quiz");
            });
        });
    },
    function(session, result) {
        var affirmations = session.localizer.getEntry(session.preferredLocale(), "affirmation");
        var normalizedResponse = utility.normalizeResponse(result.response);
        console.log("Looking for '%s' in %s", normalizedResponse, JSON.stringify(affirmations));

        if(affirmations.includes(normalizedResponse)) {
            session.replaceDialog("/quiz");
        }
        else {
            session.endDialog("done");
        }
    }
]);

bot.dialog("/help", [
    function(session) {
        session.endDialog("help");
    }
]);
bot.beginDialogAction("help", "/help", { matches: [
    /aiuto/i,
    /^come/i,
    /help/i,
    /^how/i
] });
