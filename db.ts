const pgPromise = require("pg-promise");
const R = require("ramda");

const { database } = require("./config");

// Limit the amount of debugging of SQL expressions
const trimLogsSize: number = 200;

const pgpDefaultConfig = {
  promiseLib: require("bluebird"),
  // Log all querys
  query(query) {
    console.log("[SQL   ]", R.take(trimLogsSize, query.query));
  },
  // On error, please show me the SQL
  error(err, e) {
    if (e.query) {
      console.error("[SQL   ]", R.take(trimLogsSize, e.query), err);
    }
  },
};

console.info(
  "Connecting to the database:",
  `${database.user}@${database.host}:${database.port}/${database.database}`
);

const pgp = pgPromise(pgpDefaultConfig);
const db = pgp(database);

function init() {
  return db.none(
    `
      CREATE TABLE IF NOT EXISTS github_users (
        id BIGSERIAL,
        login TEXT,
        name TEXT,
        company TEXT,
        UNIQUE(login)
      );
    `
  );
}

interface GithubUsers {
  id: number;
  name: string;
  login: string;
  company: string;
}

function createGithubUser(data: GithubUsers) {
  return db.one(
    `
      INSERT INTO
        github_users (login, name, company)
      VALUES
        ($[login], $[name], $[company])
      ON CONFLICT (login)
        DO UPDATE SET name = $[name], company = $[company]
      RETURNING id;
    `,
    data
  );
}

function listGithubUsers() {
  return db.manyOrNone("SELECT * FROM github_users");
}

module.exports = {
  init,
  createGithubUser,
  listGithubUsers,
};
