require("dotenv").config();
const request = require("request-promise");
const commandLineArgs = require("command-line-args");

const DB = require("./db");

const optionDefinitions = [
  { name: "list", alias: "l", type: Boolean },
  {
    name: "user",
    type: String,
    multiple: false,
    defaultOption: true,
    defaultValue: "gaearon",
  },
];

const options = commandLineArgs(optionDefinitions);

DB.init()
  .then(() => {
    if (options.list) {
      return DB.listGithubUsers().then((users) => console.log(users));
    } else {
      return request({
        uri: `https://api.github.com/users/${options.user}`,
        headers: {
          "User-Agent": "Request-Promise",
        },
        json: true,
      })
        .then((data) => DB.createGithubUser(data))
        .then(({ id }) => console.log(id));
    }
  })
  .then(() => process.exit(0));
