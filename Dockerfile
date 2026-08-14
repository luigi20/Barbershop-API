FROM node:24-bookworm

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

RUN yarn prisma generate 

EXPOSE 3333

CMD ["sh", "-c", "yarn prisma migrate dev && yarn serverless offline --host 0.0.0.0 --httpPort 3333"]