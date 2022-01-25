import { Promise } from "bluebird";

import DB from "./db";
import Github from "./github_api";

function listGithubUsers(options: {
  location?: string;
  language?: string;
}): PromiseLike<void> {
  return DB.listGithubUsers(options).then((users) => console.log(users));
}

function loadGithubUsers(options: { user?: string }): PromiseLike<void> {
  const username = options.user || "gaearon";

  return Promise.all([
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
