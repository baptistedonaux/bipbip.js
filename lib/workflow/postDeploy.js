"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    config.internal.write("\n>> Running post deployment commands");

    return _run(config);
};

function _run(config) {
    let promise = new Promise((resolve) => {
        resolve();
    });

    if (config.commands.postDeploy.length > 0) {
        for (let i = 0; i < config.commands.postDeploy.length; i++) {
            promise = promise.then(exec.remote.bind(
                exec,
                config.internal.write,
                config.internal.server,
                {
                    "cmd": `cd ${config.internal.server.to}/releases/${config.internal.release} && ${config.commands.postDeploy[i]}`,
                    "label": `(${config.internal.server.user}@${config.internal.server.host}:${config.internal.server.port}) ${config.commands.postDeploy[i]}`
                }
            ));
        }
    }

    promise = promise.then(() => {
        return config;
    });

    return promise;
}