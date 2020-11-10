const request = require('supertest');
require('dotenv').config();

const api_url = process.env.URL;

describe('Testing reviews list', () => {
	const req = request(api_url);
	let res;

	beforeAll(() => {
		return Promise.resolve(req.get('/reviews').query('product_id=2')).then(
			(response) => (res = response)
		);
	});

	it('should get default reviews for product 2', (done) => {
		// const res = await req.get('/reviews').query('product_id=2');

		const { product, results, count, page } = res.body;

		expect(res.status).toBe(200);
		expect(product).toBe('2');
		expect(Array.isArray(results)).toBe(true);
		expect(count < 6).toBe(true);
		expect(page).toBe(0);

		results.forEach((review) => testReview(review));
		done();
	});

	it(`review should have all fields`, (done) => {
		const { product, results, count, page } = res.body;

		results.forEach((review) => {
			testReview(review);
		});

		done();
	});
});

function testReview(review) {
	const {
		review_id,
		rating,
		summary,
		recommend,
		response,
		body,
		date,
		reviewer_name,
		helpfulness,
		photos,
	} = review;

	expect(Number(review_id)).not.toBeNaN();
	expect(Number(rating)).not.toBeNaN();
	expect(typeof summary).toBe('string');
	expect(Number(recommend)).not.toBeNaN();
	expect(typeof response).toBe('string');
	expect(typeof body).toBe('string');
	expect(Date.parse(date)).not.toBeNaN();
	expect(typeof reviewer_name).toBe('string');
	expect(Number(helpfulness)).not.toBeNaN();

	photos.forEach((photo) => {
		expect(typeof photo.id).toBe('number');
		expect(Number(photo.id)).not.toBeNaN();
		expect(photo.url).toEqual(expect.stringMatching(/^https?:\/\//));
	});
}
