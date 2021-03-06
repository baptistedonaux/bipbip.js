"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    config.internal.write("\n>> Clean old releases");

    return _ls(config);
};

function _ls(config) {
    return exec.remote(
        config.internal.write,
        config.internal.server,
        `ls -1dt ${config.internal.server.to}/releases/* | tail -n +${(config.releases + 1).toString()} | xargs rm -rf`
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}