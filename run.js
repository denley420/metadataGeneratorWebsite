const { series } = require("async");
const { exec } = require("child_process");

series([() => exec(`PORT=${process.env.PORT || "5001"} npm start`)]);