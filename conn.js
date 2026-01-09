var mysql = require("mysql");
var util = require("util");

var conn = mysql.createConnection({
    host: "bhczgmwkb7cct49uitrt-mysql.services.clever-cloud.com",
    user: "uwyeq2otxgtoip2e",
    password: "ljYTH7uPW5x9zvkm3TZW",
    database: "bhczgmwkb7cct49uitrt"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
