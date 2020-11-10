const request = require('supertest');
require('dotenv').config();

const api_url = process.env.URL;
const expected = require('./mockProducts.json');

describe('Testing Products API', () => {
	const req = request(api_url);

	afterAll(() => {
		cleanup();
	});

	it('should get product list', async (done) => {
		const response = await req.get('/products');
		expect(response.status).toBe(200);
		expect(response.body).toEqual(expected);
		expect(response.body[0].features).toBeUndefined();
		done();
	});

	it('should provide list based on count param', async (done) => {
		const res = await req.get('/products?count=25');
		expect(res.status).toBe(200);
		expect(res.body.length).toBe(25);
		done();
	});

	it('should get product 1', async (done) => {
		const response = await req.get('/products/1');
		expect(response.status).toBe(200);
		expect(response.body.id).toBe(1);
		expect(response.body.features).toEqual(
			expect.arrayContaining([{ feature: 'Buttons', value: 'Brass' }])
		);
		done();
	});

	it('should not get product hello', async (done) => {
		const res = await req.get('/products/hello');
		expect(res.status).toBe(404);
		expect(res.text).toEqual('Error: invalid product id provided');
		done();
	});
});

describe('Should get products by id', () => {
	const goodIds = [2, 44, 1000, 7000, 10000];
	const badIds = ['hellllo', 5.55, null];

	afterAll(() => {
		cleanup();
	});

	test('should return products by id', async () => {
		const goodProducts = await getProducts(goodIds).then((result) =>
			result.map((res, idx) => [res.body.id, goodIds[idx]])
		);

		goodProducts.forEach((product) => {
			expect(product[0]).toBe(product[1]);
		});
	});

	test('should not return products by id', async () => {
		const badProducts = await getProducts(badIds).then((result) =>
			result.map((res, idx) => [res.status, 404])
		);
		badProducts.forEach((product) => {
			expect(product[0]).toBe(product[1]);
		});
	});
});

describe('Product styles', () => {
	const req = request(api_url);

	it('should get styles for product 1', async (done) => {
		const res = await req.get('/products/1/styles');

		const {
			style_id,
			name,
			original_price,
			sale_price,
			photos,
			skus,
		} = res.body.results[0];

		expect(res.status).toBe(200);
		expect(name).toBe('Forest Green & Black');
		expect(original_price).toBe('140');
		expect(typeof sale_price).toBe('string');
		expect(res.body.results[0]['default?']).toBe(1);
		expect(Array.isArray(photos)).toBe(true);
		expect(/http/.test(photos[0].url)).toBe(true);
		expect(typeof skus).toBe('object');
		done();
	});
});

describe('Testing related products for different ids', () => {
	const goodIds = [2, 44, 1000, 7000, 10000];
	const badIds = ['hellllo', 5.55, null];

	goodIds.forEach((prodId, idx) => {
		it(`it should not return related for ${prodId}`, async (done) => {
			const response = await request(api_url).get(
				`/products/${prodId}/related`
			);

			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
			expect(Array.isArray(response.body)).toBe(true);

			const relatedTypes = response.body.filter((id) => typeof id !== 'number');
			expect(relatedTypes.length).toBe(0);
			done();
		});
	});

	badIds.forEach((prodId, idx) => {
		it(`it should not return related for ${prodId}`, async (done) => {
			const response = await request(api_url).get(
				`/products/${prodId}/related`
			);

			expect(response.status).toBe(404);
			expect(response.body).toBeDefined();
			done();
		});
	});
});

// request maker for iterative tests
function getProducts(ids, endpoint) {
	const products = ids.map((id, idx) => {
		const req = request(api_url);
		const res = req.get(`/products/${id}${endpoint}`);
		return res;
	});
	return Promise.all(products);
}
