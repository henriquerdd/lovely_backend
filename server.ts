require("dotenv").config();

import API from "./api";
import { parseCommandLineArgs, AvailableCommands } from "./command-line-parser";

function run(): PromiseLike<void> {
  const command = parseCommandLineArgs();

  console.log(command);

  switch (command.name) {
    case AvailableCommands.list:
      return API.listGithubUsers(command.options);
    case AvailableCommands.load:
      return API.loadGithubUsers(command.options);
    default:
      console.log("Nothing to see here");
  }
}

run().then(() => process.exit(0));
