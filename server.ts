import "dotenv/config";
import { Promise } from "bluebird";

import API from "./api";
import { parseCommandLineArgs, AvailableCommands } from "./command-line-parser";
import * as commandLineUsage from "command-line-usage";

const usage = commandLineUsage([
  {
    header: "A very simple github backend api",
    content: "Lists previously loaded users upon request",
  },
  {
    header: "List",
    optionList: [
      {
        name: "location",
        alias: "l",
        description: "Filters users by their location. Example: Lisbon",
        type: String,
      },
      {
        name: "language",
        alias: "L",
        description: "Filters users by their known languages. Example: PHP",
        type: String,
      },
      {
        name: "page",
        alias: "p",
        description: "Request a specific page. Min: 1",
        type: Number,
      },
      {
        name: "limit",
        alias: "m",
        description: "Request a batch of users of this size. Min: 1, Max: 30 ",
        type: Number,
      },
    ],
  },
  {
    header: "Load",
    optionList: [
      {
        name: "user",
        alias: "u",
        description:
          "Load a specific user. Defaults to 'gaearon' if not specified.",
        type: String,
        defaultValue: "gaearon",
      },
    ],
  },
]);

function run() {
  let command;

  try {
    command = parseCommandLineArgs();
  } catch (err) {
    return Promise.reject(err);
  }

  switch (command.name) {
    case AvailableCommands.list:
      return API.listGithubUsers(command.options);
    case AvailableCommands.load:
      return API.loadGithubUsers(command.options);
    case AvailableCommands.help:
      console.log(usage);
      return Promise.resolve();
    default:
      console.log(usage);
  }

  return Promise.resolve();
}

run()
  .catch((err) => {
    console.error(err.message);
    console.log(usage);
  })
  .finally(() => process.exit(0));
