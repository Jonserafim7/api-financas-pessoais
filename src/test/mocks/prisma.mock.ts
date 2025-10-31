export class PrismaMock {
	category = {
		create: jest.fn(),
		findMany: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	transaction = {
		create: jest.fn(),
		findMany: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	budget = {
		create: jest.fn(),
		findMany: jest.fn(),
		findFirst: jest.fn(),
		findUnique: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	user = {
		findUnique: jest.fn(),
		findMany: jest.fn(),
	};
}

export const createPrismaMock = () => new PrismaMock();
