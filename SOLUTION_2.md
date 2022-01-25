# How to run

First create a `.env` file following the `.env.example` as example. Set the environment variables according to your environment.
Then run `docker-compose up -d`, this will build the images and start the containers, the database will be daemonized and will be waiting for connections. The node image will install dependencies and will terminate. Its default container command will display the available commands and their options.

After that the easiest way to run multiple commands is to run the container with some terminal, for example:

```
  docker-compose run node bash
```

Then you are ready to start sending commands to the api, for exemple:

```
  npm run test load
```

To pass options to the underlyin command it is necessary to add a double-dash (`--`) after the command name:

```
  npm run test load -- -u henrique
```

# Challenge:

## Improve the database calls to allow the program to be run any number of times (without complaining that the table already exists) (what would be a more permanent solution to this?);

I did this by using docker and saving the queries to create the needed tables on the /docker-entrypoint-initdb.d folder, this
guarantees that these queries will run only once (the first time the container is executed), however if any errors happen during their execution,
the container will be restarted and since the postgres/data folder will not be empty, the scripts will not run again, meaning the database will
(probably) be broken. To solve this, the problematic script must be fixed, the data folder emptied and the container re-created.

A more permanent solution would be to use a database migration management lib. Then we would add a command to update the database with any new
migrations when its container starts.

## Improve the program to take a command-line argument with the name of the GitHub user;

By using a command line parser lib I added commands to the api, `load` and `list`.
By running `load` and passing it the `--user` (`-u` for short) option followed by the username, the caller can decide which user will be saved
to the database.

## Add more fields (to the database and to the API calls);

The following filds where added to the `github_user` table:

```
  blog VARCHAR(191),
  email VARCHAR(191),
  location TEXT,
  bio TEXT,
  hireable BOOLEAN
```

The api now has a second command called list, it can be used to list all the users on the database (paginated). The command accepts the following
options:

- --page (-p): The pagination page parameter. Expects a number, the minimum value is `1`.
- --limit (-m): The pagination limit parameter. Expects a number, the maximum value is `30` and the minimum `1`.
- --location (-l): Filter the users by their location. Expects a string, like _Lisbon_.
- --language (-L): Filter the users by their known languages. Expects a string, like _typescript_.

## Modify the code or database to not allow duplicate users on the database;

Since login works as a alternative key (no 2 users on github share the same login), I have made it into a unique index. If the user tries
to load a existing user again, an update occurs. This is not perfect I know, but for the purpose of this test, it works.

## Modify the program to, under a different command-line option, list all users on the database registered on Github as being in Lisbon; Try to split the code into functions to access the database, and functions that process the database results (pure functions);

Done! The list command was added as explained above. The users must first be loaded into the database using the `load` command. After that it is possible to list all the users on Lisbon by running:

```
  npm run test list -- -l Lisbon
```

There is very little processing being done to the query results, so they are a little mixed, but I've tried to keep the functions as simple as possible.

## Now assume we want to have a list of languages liked by each user - how would you add that information to the database, and how could you select a user on a given location and with a given language preference;

I have created to new tables:

```
  CREATE TABLE IF NOT EXISTS programming_language (
    id BIGSERIAL,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL,
    UNIQUE(slug)
  );

  CREATE TABLE IF NOT EXISTS github_user_language (
    user_id BIGINT NOT NULL,
    language_id BIGINT NOT NULL,
    PRIMARY KEY(user_id, language_id)
  );
```

The _programming_language_ table is used to store the languages we may come accross. Slug is an alternative key, that we can use to query the languages more easily regardless of how the user has typed it: _TypeScript_, _typescript_ and _tYpEsCrIpT_. They will all be mapped to the same language.

The _github_user_language_ is used to link users and languages. With this when can filter users by their known languages.

It is also necessary to load them before this can be successfully applied. But after that users can be filtered by language with the following command:

```
  npm run test list -- -L <MY_FAVORITE_LANGUAGE>
```

## If the tables become too big / the accesses too slow, what would you do to improve its speed?

The first thing would be checking if any indexes would be helpful, since we usually query against the location column it is good candidate.
If that is not enough we could build a cache, to save hot records to it, we would then check if the records we want are there before going to the database.
