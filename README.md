# Challenge 1: Code analysis

Using the library ramda, what is the result of the following code?

R.reduce((acc,x) => R.compose(R.flip(R.prepend)(acc), R.sum,R.map(R.add(1)))([x,...acc]), [0])([13, 28]);

Explain each of the steps the best you can, and what is the advantage of using these kinds of libraries.

# Challenge 2: BACKEND

SETUP:

- Create a repo with the provided zip
- Install Postgres (v10 or 11 preferably) & nodejs 10 (describe what you needed to do to have these versions);
- Create the test database using the ./createdb.sh script
- Install the npm modules for this project running npm install
- Run npm run test to get the program running (modify the user and password if needed, accordingly with your database configuration)
- Examine the typescript code under server.ts

CHALLENGE:

- Improve the database calls to allow the program to be run any number of times (without complaining that the table already exists) (what would be a more permanent solution to this?);
- Improve the program to take a command-line argument with the name of the GitHub user;
- Add more fields (to the database and to the API calls);
- Modify the code or database to not allow duplicate users on the database;
- Modify the program to, under a different command-line option, list all users on the database registered on Github as being in Lisbon; Try to split the code into functions to access the database, and functions that process the database results (pure functions);
- Now assume we want to have a list of languages liked by each user - how would you add that information to the database, and how could you select a user on a given location and with a given language preference;
- If the tables become too big / the accesses too slow, what would you do to improve its speed?
