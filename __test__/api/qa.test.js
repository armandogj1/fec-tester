const request = require('supertest');
require('dotenv').config();

const api_url = process.env.URL;

describe('Testing Q&A API', () => {
	const req = request(api_url);

	afterAll(() => {
		cleanup();
	});

	it('should get questions for product 1', async (done) => {
		const response = await req.get('/qa/questions/').query('product_id=1');
		expect(response.status).toBe(200);
		expect(response.body.product_id).toBe('1');
		expect(response.body.results).toBeDefined();
		done();
	});

	it('should not get questions product hello', async (done) => {
		const res = await req.get('/qa/questions/').query('product_id=hello');
		expect(res.status).toBe(422);
		expect(res.body).toEqual({});
		done();
	});
});

describe('Testing questions for given product', () => {
	const req = request(api_url);

	const goodIds = [1, 20, 100, 500, 1000];
	goodIds.forEach((productId) => {
		it(`should get answers for ${productId}`, async (done) => {
			const res = await req
				.get('/qa/questions')
				.query(`product_id=${productId}`);

			expect(res.status).toBe(200);

			// check the results array
			for (let question of res.body.results) {
				const {
					question_id,
					question_body,
					question_date,
					asker_name,
					question_helpfulness,
					reported,
					answers,
				} = question;

				expect(typeof question_id).toBe('number');
				expect(typeof question_body).toBe('string');
				expect(Date.parse(question_date)).not.toBeNaN();
				expect(typeof asker_name).toBe('string');
				expect(typeof question_helpfulness).toBe('number');
				expect(typeof reported).toBe('number');
				const isAnswersObj =
					typeof answers === 'object' && !Array.isArray(answers);
				expect(isAnswersObj).toBe(true);

				for (const answer in answers) {
					const {
						id,
						body,
						date,
						answerer_name,
						helpfulness,
						photos,
					} = answers[answer];
					// console.log(answer);
					expect(typeof id).toBe('number');
					expect(typeof body).toBe('string');
					expect(Date.parse(date)).not.toBeNaN();
					expect(typeof answerer_name).toBe('string');
					expect(typeof helpfulness).toBe('number');
					expect(Array.isArray(photos)).toBe(true);
				}
			}

			done();
		});
	});
});

describe('Testing answers for given question', () => {
	const req = request(api_url);
	const goodIds = [2, 100, 500, 1000];

	goodIds.forEach((questionId) => {
		it(`should get answers for ${questionId}`, async (done) => {
			const res = await req.get(`/qa/questions/${questionId}/answers`);

			const { status, body } = res;

			expect(status).toBe(200);
			expect(body).toBeDefined();
			expect(Array.isArray(body.results)).toBe(true);

			if (body.results.length) {
				const {
					answer_id,
					helpfulness,
					answerer_name,
					photos,
				} = body.results[0];
				expect(typeof answer_id).toBe('number');
				expect(typeof body.results[0].body).toBe('string');
				expect(typeof answerer_name).toBe('string');
				expect(typeof helpfulness).toBe('number');
				expect(Array.isArray(photos)).toBe(true);
			}
			done();
		});
	});

	const badIds = ['string', 5.55, null];
	badIds.forEach((questionId) => {
		it(`should get not answers for ${questionId}`, async (done) => {
			const res = await req.get(`/qa/questions/${questionId}/answers`);

			const { status, body } = res;

			expect(status).toBe(404);
			expect(body).toBeDefined();
			expect(body.results).toBe(undefined);

			done();
		});
	});
});

const example = {
	question_id: 38,
	question_body: 'How long does it last?',
	question_date: '2019-06-28T00:00:00.000Z',
	asker_name: 'funnygirl',
	question_helpfulness: 2,
	reported: 0,
	answers: {},
};
