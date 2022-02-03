FROM node:10

WORKDIR /app

COPY ./src /app

RUN npm i

CMD [ "npm", "run", "test" ]
