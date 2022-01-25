import Bluebird from "bluebird";
import * as pgPromise from "pg-promise";
import * as R from "ramda";

import { database } from "./config";

// Limit the amount of debugging of SQL expressions
const trimLogsSize: number = 200;

const pgpDefaultConfig = {
  promiseLib: Bluebird,
  query: (query: { query: string }): void => {
    // Log all querys
    console.log("[SQL   ]", R.take(trimLogsSize, query.query));
  },
  error: (err: Error, e: { query?: string }): void => {
    // On error, please show me the SQL
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

interface GithubUsers {
  id: number;
  name: string;
  login: string;
  company: string;
  blog: string;
  email: string;
  location: string;
  bio: string;
  hireable: boolean;
}

function createGithubUser(
  data: GithubUsers
): PromiseLike<Pick<GithubUsers, "id">> {
  return db.one(
    `
      INSERT INTO
        github_user (login, name, company, blog, email, location, bio, hireable)
      VALUES
        ($[login], $[name], $[company], $[blog], $[email], $[location], $[bio], $[hireable])
      ON CONFLICT (login)
        DO UPDATE SET name=$[name], company=$[company], blog=$[blog], email=$[email], location=$[location], bio=$[bio], hireable=$[hireable]
      RETURNING id;
    `,
    data
  );
}

function listGithubUsers(
  options: { locations?: string[]; language?: string[] } = {}
): PromiseLike<GithubUsers[]> {
  const locations = options.locations || [];

  let query = [
    "SELECT * FROM github_user",
    locations.length
      ? " WHERE (" +
        locations
          .map((location) => pgp.as.format(`location ILIKE %$1%`, [location]))
          .join(" OR ") +
        ")"
      : "",
  ].join("");

  return db.manyOrNone(query);
}

export default { createGithubUser, listGithubUsers };
