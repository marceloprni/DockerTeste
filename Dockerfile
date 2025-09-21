FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./
RUN npm install --production

COPY src ./src

USER app
EXPOSE 3000
CMD ["node", "src/index.js"]