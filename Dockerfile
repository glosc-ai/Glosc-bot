FROM node:20-slim AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN npm cache clean --force
ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
COPY --from=build /usr/src/app/lib ./lib
EXPOSE 3000
CMD [ "npm", "start" ]
