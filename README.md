# FEC Server Tester

Testing suite for FEC API microservices using Jest and Supertest.

## Initialize

- run `npm install`
- include domain name (and port if running locally)
- test with `npm test`
  - for products tests `npm run test-products`
  - for questions and answers tests `npm run test-qa`
  - for reviews tests `npm run test-reviews`

## Refactor

If endpoints differ from Atelier API some refactoring may be needed for the request to reach proper routes.
