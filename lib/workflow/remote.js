"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    config.internal.write("\n>> Running remote commands");

    return _run(config);
};

function _run(config) {
    let promise = new Promise((resolve) => {
        resolve();
    });

    if (config.commands.remote.length > 0) {
        for (let i = 0; i < config.commands.remote.length; i++) {
            promise = promise.then(exec.remote.bind(
                exec,
                config.internal.write,
                config.internal.server,
                {
                    "cmd": `cd ${config.internal.server.to}/releases/${config.internal.release} && ${config.commands.remote[i]}`,
                    "label": `(${config.internal.server.user}@${config.internal.server.host}:${config.internal.server.port}) ${config.commands.remote[i]}`
                }
            ));
        }
    }

    promise = promise.then(() => {
        return config;
    });

    return promise;
}