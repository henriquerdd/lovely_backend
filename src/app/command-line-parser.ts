import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

export enum AvailableCommands {
  list = "list",
  load = "load",
  help = "help",
}

type ListCommandOptions = {
  location?: string;
  language?: string;
  page?: number;
  limit?: number;
};

type LoadCommandOptions = {
  user?: string;
  location?: string;
};

type ParsedCommand =
  | {
      name: AvailableCommands.list;
      options: ListCommandOptions;
    }
  | {
      name: AvailableCommands.load;
      options: LoadCommandOptions;
    };

const COMMAND_DEFINITION: commandLineArgs.OptionDefinition[] = [
  { name: "command", defaultOption: true, defaultValue: "help" },
];

function parseListCommandOptions(argv: string[]): ListCommandOptions {
  return commandLineArgs(
    [
      { name: "location", type: String, alias: "l" },
      { name: "language", type: String, alias: "L" },
      { name: "page", type: Number, alias: "p" },
      { name: "limit", type: Number, alias: "m" },
    ],
    { argv }
  ) as ListCommandOptions;
}

function parseLoadCommandOptions(argv: string[]): LoadCommandOptions {
  return commandLineArgs(
    [
      {
        name: "user",
        type: String,
        alias: "u",
        defaultOption: true,
        defaultValue: "gaearon",
      },
    ],
    { argv }
  ) as LoadCommandOptions;
}

const OPTIONS_PARSERS: Record<
  AvailableCommands,
  (argv: string[]) => Record<string, any>
> = {
  [AvailableCommands.list]: parseListCommandOptions,
  [AvailableCommands.load]: parseLoadCommandOptions,
  [AvailableCommands.help]: () => ({}),
};

export function parseCommandLineArgs(): ParsedCommand {
  const mainOptions = commandLineArgs(COMMAND_DEFINITION, {
    stopAtFirstUnknown: true,
  });

  const argv = mainOptions._unknown || [];

  if (mainOptions.command in OPTIONS_PARSERS) {
    const options = OPTIONS_PARSERS[mainOptions.command](argv);
    return { name: mainOptions.command, options: options };
  }

  throw new Error(`Unknown command: ${mainOptions.command}`);
}

export const usage = commandLineUsage([
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
