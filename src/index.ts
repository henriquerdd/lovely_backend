import "dotenv/config";
import * as Bluebird from "bluebird";

import API from "./app/lovely_api";
import {
  parseCommandLineArgs,
  AvailableCommands,
  usage,
} from "./app/command-line-parser";

function run(): Bluebird<void> {
  let command;

  try {
    command = parseCommandLineArgs();
  } catch (err) {
    return Bluebird.reject(err);
  }

  switch (command.name) {
    case AvailableCommands.list:
      return API.listGithubUsers(command.options);
    case AvailableCommands.load:
      return API.loadGithubUsers(command.options);
    case AvailableCommands.help:
      console.log(usage);
      return Bluebird.resolve();
    default:
      console.log(usage);
  }

  return Bluebird.resolve();
}

run()
  .catch((err) => {
    console.error(err.message);
    console.log(usage);
  })
  .finally(() => {
    process.exit(0);
  });
