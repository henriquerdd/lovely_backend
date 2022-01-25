FROM node:10

WORKDIR /app

COPY ./* /app

RUN npm i

CMD [ "npm", "run", "test" ]
