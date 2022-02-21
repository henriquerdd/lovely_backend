import * as Bluebird from "bluebird";

import DB from "../data/db";
import Github from "../data/github_api";

function listGithubUsers(options: {
  location?: string;
  language?: string;
}): Bluebird<void> {
  return DB.listGithubUsers(options).then((users) => console.log(users));
}

function loadGithubUsers(options: { user?: string }): Bluebird<void> {
  const username = options.user || "gaearon";

  return Bluebird.all([
    Github.getUser(username),
    Github.getRepositories(username),
  ])
    .then(([user, repos]) => {
      if (!user) throw new Error("User not found");

      user.languages = (repos || [])
        .filter((repo) => repo.language)
        .map((repo) => repo.language);

      return DB.createGithubUser(user);
    })
    .then(({ id }) => console.log(id));
}

export default { listGithubUsers, loadGithubUsers };
