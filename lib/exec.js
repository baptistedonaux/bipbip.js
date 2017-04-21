"use strict";

const childProcess = require("child_process"),
    message = require("./logger.js").buildMessage;

module.exports.local = function(write, command, options, escape, inline) {
    return new Promise((resolve, reject) => {
        let messages = [{
            "color": "green",
            "message": command
        }];

        if (options === undefined) {
            options = {};
        }

        if (inline !== true) {
            message(write, messages);
        }

        childProcess.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                return reject(stderr);
            }

            let response = stdout.toString();

            if (escape === undefined || escape === true) {
                response = response.replace("\n", "");
            }

            if (inline === true) {
                messages.push({
                    color: "white",
                    message: "→"
                });

                messages.push({
                    color: "mint",
                    message: response
                });
            } else {
                messages = [{
                    color: "mint",
                    message: response
                }];
            }

            message(write, messages);

            resolve(response);
        });
    });
};

module.exports.remote = function(write, server, command, escape, inline) {
    return new Promise((resolve, reject) => {
        command =  `ssh -o StrictHostKeyChecking=no ${server.user}@${server.host} '${command}'`;

        let messages = [{
            "color": "green",
            "message": command
        }];

        if (inline !== true) {
            message((message) => {
                write(message, server);
            }, messages);
        }

        childProcess.exec(command, function(error, stdout, stderr) {
            if (error) {
                return reject(stderr);
            }

            let response = stdout.toString();

            if (escape === undefined || escape === true) {
                response = response.replace("\n", "");
            }

            if (inline === true) {
                messages.push({
                    color: "white",
                    message: "→"
                });

                messages.push({
                    color: "mint",
                    message: response
                });
            } else {
                messages = [{
                    color: "mint",
                    message: response
                }];
            }

            message((message) => {
                write(message, server);
            }, messages);

            resolve(response);
        });
    });
};
