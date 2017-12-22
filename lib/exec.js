"use strict";

const chalk = require("chalk"),
    childProcess = require("child_process"),
    helper = require("./helper.js"),
    separator = "--";

function local(write, command, options, follow) {
    if (typeof command !== "object") {
        command = {
            "cmd": command,
            "label": command
        };
    }

    if (follow === undefined) {
        follow = false;
    }

    return new Promise((resolve, reject) => {
        let message = `\t * ${command.label}`;

        if (options === undefined) {
            options = {};
        }

        if (follow === true) {
            write(`${message}\n${separator}`);
        }

        const subProcess = childProcess.exec(command.cmd, options, (error, stdout, stderr) => {
            if (error) {
                if (stderr === "") {
                    stderr = "no error message retrieve";
                }

                if (follow === false && helper.lines(stderr) === 1) {
                    message += ` → ${chalk.red(stderr)}`;
                } else if (follow === false) {
                    message += `\n${chalk.red(stderr)}`;
                } else {
                    message = `${separator}\n${chalk.red(stderr)}`;
                }
                
                return reject(`${message}\n\nTo reproduce this error, please run this command:\n\t${command.cmd}`);
            }

            let response = stdout.toString();

            if (response !== "" && follow === false && helper.lines(response) === 1) {
                message += ` → ${chalk.green(response.replace("\n", ""))}`;
            } else if (response !== "" && follow === false) {
                message += `${chalk.green(response)}\n${separator}\n`;
            } else {
                message = "";
            }

            if (message.length !== 0) {
                write(message);
            }

            resolve(response);
        });

        if (follow === true) {
            subProcess.stdout.on('data', function(data) {
                write(chalk.green(data.toString().replace(/\n$/, "")));
            });

            subProcess.stderr.on('data', function(data) {
                write(chalk.yellow(data.toString()));
            });

            subProcess.on("exit", () => {
                write(`${separator}\n`);
            });
        }
    });
}

module.exports.local = local;

module.exports.remote = function(write, server, command) {
    if (typeof command !== "object") {
        command = {
            "cmd": command,
            "label": `(${server.user}@${server.host}:${server.port}) ${command}`
        };
    }

    command.cmd = `ssh -o StrictHostKeyChecking=no -p ${server.port} ${server.user}@${server.host} '${command.cmd}'`;

    return local(write, command);
};
