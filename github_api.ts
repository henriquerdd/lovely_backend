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

export default { getUser };
