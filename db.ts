import { Promise } from "bluebird";
import * as pgPromise from "pg-promise";
import * as R from "ramda";

import { database } from "./config";
import { slugify } from "./helpers";

// Limit the amount of debugging of SQL expressions
const trimLogsSize: number = 200;

const pgpDefaultConfig = {
  promiseLib: Promise,
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
  languages?: string[];
}

function findLanguagesBySlug(slugs: string[]) {
  return db.manyOrNone(
    "SELECT id, slug FROM programming_language WHERE slug IN ($1:csv);",
    slugs
  );
}

function createLanguages(languages: string[]) {
  const languageSlugs = languages.map(slugify);

  return findLanguagesBySlug(languageSlugs).then((existingLanguages) => {
    const existingLanguagesSet = new Set(
      existingLanguages.map((language) => language.slug)
    );

    const missingLanguages = languages.filter(
      (language) => !existingLanguagesSet.has(slugify(language))
    );

    if (!missingLanguages.length)
      return existingLanguages.map((language) => language.id);

    const columnsSet = new pgp.helpers.ColumnSet(["name", "slug"], {
      table: "programming_language",
    });

    const missingRecords = missingLanguages.map((language) => {
      return { name: language, slug: slugify(language) };
    });

    const query =
      pgp.helpers.insert(missingRecords, columnsSet) +
      " ON CONFLICT DO NOTHING RETURNING id";

    return db.many(query).then((newLanguages) => {
      return newLanguages
        .map(({ id }) => id)
        .concat(existingLanguages.map(({ id }) => id));
    });
  });
}

function linkUserAndLanguages(userId: number, languageIds: number[]) {
  const records = languageIds.map((languageId) => {
    return { user_id: userId, language_id: languageId };
  });

  const columnsSet = new pgp.helpers.ColumnSet(["user_id", "language_id"], {
    table: "github_user_language",
  });

  const query =
    pgp.helpers.insert(records, columnsSet) + " ON CONFLICT DO NOTHING";

  return db.none(query);
}

function createGithubUser(
  data: GithubUsers
): PromiseLike<Pick<GithubUsers, "id">> {
  return db
    .one(
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
    )
    .then((user) => {
      if (!data.languages || !data.languages.length) return user;

      return createLanguages(data.languages)
        .then((languageIds) => linkUserAndLanguages(user.id, languageIds))
        .then(() => user);
    });
}

function findUserIdsWithLanguage(language: string): PromiseLike<number[]> {
  const query = `
    SELECT
      gul.user_id as id
    FROM
      github_user_language gul JOIN programming_language pl ON gul.language_id=pl.id
    WHERE
      pl.slug = $1;
  `;

  const promise = db.manyOrNone(query, [slugify(language)]);
  return Promise.map(promise, ({ id }) => id);
}

function listUserLanguages(userId: number) {
  const query = `
    SELECT
      pl.name
    FROM
      github_user_language gul JOIN programming_language pl ON gul.language_id=pl.id
    WHERE
      gul.user_id = $1;`;

  const promise = db.manyOrNone(query, [userId]);
  return Promise.map(promise, ({ name }) => name);
}

function listGithubUsers(
  options: { location?: string; language?: string } = {}
) {
  let promise: PromiseLike<number[]> = options.language
    ? findUserIdsWithLanguage(options.language)
    : Promise.resolve([]);

  return promise.then((ids: number[]) => {
    if (options.language && !ids.length) return [];

    let query = [
      "SELECT * FROM github_user",
      options.location || ids.length ? " WHERE " : "",
      options.location ? " location ILIKE $[location] " : "",
      ids.length ? " id IN ($[ids:csv]) " : "",
    ].join("");

    return db.manyOrNone(query, {
      ids,
      location: options.location ? `%${options.location}%` : "",
    });
  });
}

export default { createGithubUser, listGithubUsers };
