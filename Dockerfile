FROM node:10

WORKDIR /app

COPY ./src /app/src
COPY ./package.json /app

RUN npm i

CMD [ "npm", "run", "test" ]
