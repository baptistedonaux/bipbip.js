"use strict";

const exec = require("../exec.js"),
    message = require("../logger.js").buildMessage;

module.exports = (config) => {
    message(config.internal.write, [{
        "message": "\n>> Publish new release"
    }]);

    return _ln(config);
};

function _ln(config) {
    return exec.remote(
        config.internal.write,
        config.internal.server,
        `rm -f ${config.internal.server.to}/current && ln -s ${config.internal.server.to}/releases/${config.internal.release} ${config.internal.server.to}/current`
    ).then(() => config)
    .catch((error) => {
        throw new Error(error);
    });
}
