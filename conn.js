var mysql = require("mysql");
var util = require("util");

var conn = mysql.createConnection({
    host: "by8yxirheybwrdflhznk-mysql.services.clever-cloud.com",
    user: "udfge0vm4mzzjqxl",
    password: "YZzlokTZmg0pgYlKIw5u",
    database: "by8yxirheybwrdflhznk"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
