FROM node:10

WORKDIR /app

VOLUME /app

CMD [ "npm", "run", "test" ]
