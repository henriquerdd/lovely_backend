import * as request from "request-promise";

function getUser(username: string) {
  return request({
    uri: `https://api.github.com/users/${username}`,
    headers: {
      "User-Agent": "Request-Promise",
    },
    json: true,
  });
}

function getRepositories(username: string) {
  return request({
    uri: `https://api.github.com/users/${username}/repos`,
    headers: {
      "User-Agent": "Request-Promise",
    },
    json: true,
  });
}

function listByLocation(location: string, page: number = 1) {
  const q = encodeURI(`location:${location}`);

  return request({
    uri: `https://api.github.com/search/users?page=${page}&per_page=100&q=${q}`,
    headers: {
      "User-Agent": "Request-Promise",
    },
    json: true,
  });
}

export default { getUser, getRepositories, listByLocation };
