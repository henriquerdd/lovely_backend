import * as Bluebird from "bluebird";
import * as pgPromise from "pg-promise";
import * as R from "ramda";

import { database } from "../config";
import { slugify } from "../app/helpers";

// Limit the amount of debugging of SQL expressions
const trimLogsSize: number = 200;
const maxRecordsPerPage: number = 30;

const pgpDefaultConfig: Parameters<typeof pgPromise> = [
  {
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
  },
];

console.info(
  "Connecting to the database:",
  `${database.user}@${database.host}:${database.port}/${database.database}`
);

const pgp = pgPromise(...pgpDefaultConfig);
const db = pgp(database);

export interface GithubUser {
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

function getLanguageIds(languages: string[]) {
  const languageSlugs = languages.map(slugify);

  return findLanguagesBySlug(languageSlugs).then((existingLanguages) => {
    const existingLanguagesSet = new Set(
      existingLanguages.map((language) => language.slug)
    );

    const missingLanguages = languages.filter(
      (language) => !existingLanguagesSet.has(slugify(language))
    );

    if (missingLanguages.length === 0)
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

function createGithubUser(data: GithubUser): Bluebird<Pick<GithubUser, "id">> {
  let userPromise = db.one(
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
  ) as Bluebird<GithubUser>;

  return userPromise.tap((user) => {
    if (!data.languages || !data.languages.length) return;

    return getLanguageIds(data.languages).then((languageIds) =>
      linkUserAndLanguages(user.id, languageIds)
    );
  });
}

function findUserIdsWithLanguage(language: string) {
  const query = `
    SELECT
      gul.user_id as id
    FROM
      github_user_language gul JOIN programming_language pl ON gul.language_id=pl.id
    WHERE
      pl.slug = $1;
  `;

  const promise = db.manyOrNone(query, [slugify(language)]);
  return Bluebird.map(promise, ({ id }) => id);
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
  return Bluebird.map(promise, ({ name }) => name);
}

function listGithubUsers(
  options: {
    location?: string;
    language?: string;
    page?: number;
    limit?: number;
  } = {}
): Bluebird<GithubUser[]> {
  let promise = options.language
    ? findUserIdsWithLanguage(options.language)
    : Bluebird.resolve([]);

  return promise.then((ids: number[]) => {
    if (options.language && !ids.length) return [];

    let where = "";

    if (options.location) {
      where += " location ILIKE $[location] ";
    }

    if (ids.length > 0) {
      where += `${where.length > 0 ? "AND " : ""} id IN ($[ids:csv]) `;
    }

    where = where.length > 0 ? `WHERE ${where}` : "";

    const query = `SELECT * FROM github_user ${where} LIMIT $[limit] OFFSET $[offset]`;

    const limit = Math.max(
      Math.min(options.limit || maxRecordsPerPage, maxRecordsPerPage),
      1
    );

    const offset = (Math.max(options.page || 1, 1) - 1) * limit;

    const usersPromise = db.manyOrNone(query, {
      ids,
      location: options.location ? `%${options.location}%` : "",
      offset,
      limit,
    });

    return Bluebird.map(usersPromise, (user) => {
      return listUserLanguages(user.id).then((languages) => {
        user.languages = languages;
        return user;
      });
    });
  });
}

export default { createGithubUser, listGithubUsers };
