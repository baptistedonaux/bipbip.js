"use strict";

const childProcess = require("child_process"),
    message = require("./logger.js").buildMessage;

function local(write, command, options, escape, inline) {
    return new Promise((resolve, reject) => {
        let messages = [{
            "color": "mint",
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
                if (stderr === "") {
                    stderr = "\x1B[7m" + "no error message retrieve" + "\x1B[0m";
                }

                if (inline === true) {
                    messages.push({
                        color: "white",
                        message: "→"
                    });

                    messages.push({
                        color: "red",
                        message: stderr
                    });
                } else {
                    messages = [{
                        color: "red",
                        message: stderr
                    }];
                }

                return reject(messages);
            }

            let response = stdout.toString();

            if (response !== "") {
                if (escape === undefined || escape === true) {
                    response = response.replace("\n", "");
                }

                if (inline === true) {
                    messages.push({
                        color: "white",
                        message: "→"
                    });

                    messages.push({
                        color: "green",
                        message: response
                    });
                } else {
                    messages = [{
                        color: "green",
                        message: response
                    }];
                }

                message(write, messages);
            }

            resolve(response);
        });
    });
}

module.exports.local = local;

module.exports.remote = function(write, server, command, escape, inline) {
    return local(
        write,
        `ssh -o StrictHostKeyChecking=no ${server.user}@${server.host} '${command}'`,
        {},
        escape,
        inline
    );
};
