"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    return _run(config)
        .catch((config) => {
            if (config instanceof Error) {
                throw config;
            }

            return config;
        });
};

function _run(config) {
    if (config.commands.postDeploy.length === 0) {
        return Promise.reject(config);
    }

    return exec.remote(
        config.internal.write,
        config.internal.server,
        `cd ${config.internal.server.to}/releases/${config.internal.release} && ${config.commands.postDeploy.join(" && ")}`
        )
        .then(() => config)
        .catch((error) => {
            throw new Error(error);
        });
}
