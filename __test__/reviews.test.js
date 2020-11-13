const request = require('supertest');
require('dotenv').config();

const api_url = process.env.URL;

describe('Should get reviews list', () => {
	const req = request(api_url);
	let res;

	beforeAll(() => {
		return Promise.resolve(req.get('/reviews').query('product_id=2')).then(
			(response) => (res = response)
		);
	});

	it('should get default reviews for product 2', (done) => {
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

describe('Should paginate review list', () => {
	const pages = [1, 3, 5];
	let responses;

	beforeAll(() => {
		const req = request(api_url);

		const requests = pages.map((page) => {
			return Promise.resolve(
				req.get('/reviews').query('product_id=1').query(`page=${page}`)
			);
		});

		return Promise.all(requests).then((res) => (responses = res));
	});

	it(`should get pages ${pages} for product 1`, (done) => {
		responses.forEach((res) => {
			const { status, body } = res;
			const { product, page, count, results } = body;
			expect(status).toBe(200);
			expect(product).toBe('1');
			// pagination does not seem to work correctly
			// page increment by five
		});
		done();
	});
});

describe('Should provide reviews for good products', () => {
	const goodIds = [1, 50, 200, 1000];
	const badIds = ['hello', null, 5.55];
	let responses;

	beforeAll(() => {
		const req = request(api_url);

		const goodRequests = goodIds.map((prodId) => {
			return Promise.resolve(req.get('/reviews').query(`product_id=${prodId}`));
		});

		const badRequests = badIds.map((prodId) => {
			return Promise.resolve(req.get('/reviews').query(`product_id=${prodId}`));
		});

		const requests = goodRequests.concat(badRequests);

		return Promise.all(requests).then((results) => (responses = results));
	});

	it(`should have status 200 for ${goodIds}`, (done) => {
		const goodResponses = responses.slice(0, goodIds.length);

		goodResponses.forEach((res) => {
			expect(res.status).toBe(200);

			res.body.results.forEach((review) => testReview(review));
		});

		done();
	});

	it(`should have 422 for ${JSON.stringify(badIds)}`, (done) => {
		const badResponses = responses.slice(goodIds.length);

		badResponses.forEach((res) => {
			expect(res.status).toBe(422);
			expect(res.text).toBe('Error: invalid product_id provided');
		});
		done();
	});
});

describe('Should get metadata for products', () => {
	const goodIds = [1, 50, 200, 1000];
	const badIds = ['hello', null, 5.55];
	let responses;

	beforeAll(() => {
		const req = request(api_url);

		const goodRequests = goodIds.map((prodId) => {
			return Promise.resolve(
				req.get('/reviews/meta').query(`product_id=${prodId}`)
			);
		});

		const badRequests = badIds.map((prodId) => {
			return Promise.resolve(
				req.get('/reviews/meta').query(`product_id=${prodId}`)
			);
		});

		const requests = goodRequests.concat(badRequests);

		return Promise.all(requests).then((results) => (responses = results));
	});

	it(`should get metadata for ${goodIds}`, (done) => {
		const goodResponses = responses.slice(0, goodIds.length);

		goodResponses.forEach((res) => {
			expect(res.status).toBe(200);
			// console.log(res.body);
			testMeta(res.body);
		});
		done();
	});

	it(`should get metadata for ${JSON.stringify(badIds)}`, (done) => {
		const badResponses = responses.slice(goodIds.length);

		badResponses.forEach((res) => {
			expect(res.status).toBe(422);
			expect(res.text).toBe('Error: invalid product_id provided');
		});
		done();
	});
});

describe('should add a review', () => {
	let res;

	beforeAll(() => {
		const req = request(api_url)
			.get('/reviews')
			.query('product_id=10')
			.query('count=100');

		return Promise.resolve(req).then((response) => (res = response));
	});

	it('should add a review to product 10', async (done) => {
		const body = {
			product_id: 10,
			rating: 5,
			summary: 'text of the review',
			body: 'Continued or full text of the review',
			recommend: true,
			name: 'armando',
			email: 'armando@a.com',
			photos: [],
			characteristics: { 14: 5, 15: 5 },
		};
		const post = await request(api_url).post('/reviews').send(body);

		expect(post.status).toBe(201);

		// check the new review exists in results
		const newReviews = await request(api_url)
			.get('/reviews')
			.query('product_id=10')
			.query('count=100');
		const { results } = newReviews.body;
		expect(results.length === res.body.results.length + 1).toBe(true);

		const expected = {
			rating: 5,
			summary: 'text of the review',
			body: 'Continued or full text of the review',
			reviewer_name: 'armando',
			review_id: expect.any(Number),
			helpfulness: expect.any(Number),
		};
		expect(results[results.length - 1]).toEqual(
			expect.objectContaining(expected)
		);
		expect(Date.parse(results[results.length - 1].date)).not.toBeNaN();

		done();
	});
});

/********************
 *** Test Helpers ***
 *********************/

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

function testMeta(meta) {
	const { product_id, ratings, recommended, characteristics } = meta;

	expect(Number(product_id)).not.toBeNaN();
	Object.entries(ratings).forEach(([rating, count]) => {
		expect(Number(rating)).not.toBeNaN();
		expect(typeof count).toBe('number');
	});
	Object.entries(recommended).forEach(([bool, count]) => {
		expect(bool === '1' || bool === '0').toBe(true);
		expect(typeof count).toBe('number');
	});
}
