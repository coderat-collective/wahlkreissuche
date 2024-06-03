FROM node:18-alpine3.18
ENV NODE_ENV=production

WORKDIR /wahlkreissuche/
COPY package.json yarn.lock ./
RUN yarn install

COPY . .
EXPOSE 3000
CMD ["yarn", "start"]
