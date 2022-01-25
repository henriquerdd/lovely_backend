import * as commandLineArgs from "command-line-args";

export enum AvailableCommands {
  list = "list",
  load = "load",
}

type ListCommandOptions = {
  location?: string;
  language?: string;
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
  { name: "command", defaultOption: true },
];

function parseListCommandOptions(argv: string[]): ListCommandOptions {
  return commandLineArgs(
    [
      { name: "location", type: String, alias: "l" },
      { name: "language", type: String, alias: "L" },
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
      {
        name: "location",
        type: String,
        alias: "l",
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
