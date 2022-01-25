import DB from "./db";
import Github from "./github_api";

function listGithubUsers(options: {
  location?: string[];
  language?: string[];
}): PromiseLike<void> {
  return DB.listGithubUsers(options).then((users) => console.log(users));
}

function loadGithubUsers(options: { user?: string }): PromiseLike<void> {
  return Github.getUser(options.user || "gaearon")
    .then((data) => DB.createGithubUser(data))
    .then(({ id }) => console.log(id));
}

export default { listGithubUsers, loadGithubUsers };
