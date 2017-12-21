"use strict";

const chalk = require("chalk"),
    childProcess = require("child_process");

function local(write, command, options, escape, inline, follow) {
    if (typeof command !== "object") {
        command = {
            "cmd": command,
            "label": command
        };
    }

    return new Promise((resolve, reject) => {
        let message = `\t * ${command.label}`;

        if (options === undefined) {
            options = {};
        }

        if (inline !== true) {
            write(`\t * ${command.label}`);
        }

        const subProcess = childProcess.exec(command.cmd, options, (error, stdout, stderr) => {
            if (error) {
                if (stderr === "") {
                    stderr = "no error message retrieve";
                }

                if (inline === true) {
                    message += ` → ${chalk.red(stderr)}`;
                }
                
                return reject(stderr);
            }

            let response = stdout.toString();

            if (response !== "") {
                if (escape === undefined || escape === true) {
                    response = response.replace("\n", "");
                }

                if (inline === true) {
                    message += ` → ${chalk.green(response)}`;
                } else if (follow === undefined || follow === false) {
                    message = chalk.green(response);
                } else {
                    message = "";
                }

                if (message.length !== 0) {
                    write(message);
                }
            }

            resolve(response);
        });

        if (follow === true) {
            subProcess.stdout.on('data', function(data) {
                write(chalk.green(data.toString()));
            });

            subProcess.stderr.on('data', function(data) {
                write(chalk.yellow(data.toString()));
            });
        }
    });
}

module.exports.local = local;

module.exports.remote = function(write, server, command, escape, inline) {
    if (typeof command !== "object") {
        command = {
            "cmd": command,
            "label": `(${server.user}@${server.host}:${server.port}) ${command}`
        };
    }

    command.cmd = `ssh -o StrictHostKeyChecking=no -p ${server.port} ${server.user}@${server.host} '${command.cmd}'`;

    return local(
        write,
        command,
        {},
        escape,
        inline
    );
};
