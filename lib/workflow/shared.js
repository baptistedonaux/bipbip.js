"use strict";

const file  = require("./shared/file.js"),
    folder  = require("./shared/folder.js"),
    message = require("../logger.js").buildMessage;

module.exports = (config) => {
    message(config.internal.write, [{
        "message": "\n>> Plug folders/files to share"
    }]);

    return Promise.resolve(config)
        .then(folder)
        .then(file);
};
