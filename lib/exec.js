"use strict";

const childProcess = require("child_process"),
    message = require("./logger.js").buildMessage;

function local(write, command, options, escape, inline, follow) {
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

        const subProcess = childProcess.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                if (stderr === "") {
                    stderr = "no error message retrieve";
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

                    message(write, messages);
                }

                return reject(stderr);
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
                } else if (follow === undefined || follow === false) {
                    messages = [{
                        color: "green",
                        message: response
                    }];
                } else {
                    messages = [];
                }

                if (messages.length !== 0) {
                    message(write, messages);
                }
            }

            resolve(response);
        });

        if (follow === true) {
            subProcess.stdout.on('data', function(data) {
                message(write, [{
                    message: data.toString(),
                    color: "green"
                }]);
            });

            subProcess.stderr.on('data', function(data) {
                message(write, [{
                    message: data.toString(),
                    color: "orange"
                }]);
            });
        }
    });
}

module.exports.local = local;

module.exports.remote = function(write, server, command, escape, inline) {
    return local(
        write,
        `ssh -o StrictHostKeyChecking=no -p ${server.port} ${server.user}@${server.host} '${command}'`,
        {},
        escape,
        inline
    );
};
