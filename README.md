<div align="center"> <a href="https://fastify.dev/">
    <img
      src="https://github.com/fastify/graphics/raw/HEAD/fastify-landscape-outlined.svg"
      width="650"
      height="auto"
    />
  </a>
</div>

# FastifyApiBoilerplateJWT

An API Boilerplate to create a ready-to-use REST API in seconds with Fastify + Kysely and JWT Authentication

## Installation

```sh
npm install
```

Set Environment for secret key JWT and other configurations

```sh
cp .env.example .env
```

In the project directory, you can run:

```sh
npm run dev
```

or

```sh
npm run dev:watch
```

To start the app in dev mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

```sh
npm start
```

For production mode

## Test

```sh
npm run test
```

Run the test cases. The suite needs the test database (`docker compose up -d db-postgres-test`)
and a `.env.test` file (`cp .env.test.example .env.test`): the application has a single set of
`DB_*`/`EMAIL_*` variables and each environment supplies its own values. The `users` table of
the test database is emptied at the start of every test file.

`NODE_ENV` is never read by the application and should always be `production` (it is set in the
Dockerfile); behaviour is driven by dedicated variables only, e.g. `EXPOSE_ERROR_DETAILS=true`
to include the message of unexpected errors in responses during local development.

Tests are compiled with `tsc` (see `test/tsconfig.json`) and run with the Node.js test runner on
the compiled output, so the coverage report (c8) reflects the real sources. The build fails when
coverage drops below 100% (lines, branches, functions, statements); see `.c8rc.json`.

```sh
npm run test:coverage   # same, plus an HTML report in coverage/
```

## Docker

There is a `docker-compose.yml` file for starting PostgreSQL with Docker.

```sh
docker compose up db
```

After running, you can stop the Docker container with

```sh
docker compose down
```

## Url Swagger for Api Documentation

```text
http://127.0.0.1:3000/docs
```

## License

[MIT licensed](LICENSE)
