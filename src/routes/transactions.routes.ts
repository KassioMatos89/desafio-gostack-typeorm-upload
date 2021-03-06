import { Router } from 'express';
import multer from 'multer';

import { getRepository, getCustomRepository } from 'typeorm';

import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find();
    const categoriesRepository = getRepository(Category);

    const newTransactions = transactions.map(async transaction => {
        const category = await categoriesRepository.findOne({
            where: {
                id: transaction.category_id,
            },
        });

        const transactionsRemode = {
            id: transaction.id,
            title: transaction.title,
            value: transaction.value,
            type: transaction.type,
            category,
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
        };

        return transactionsRemode;
    });

    const transactionsResults = await Promise.all(newTransactions);

    const balance = await transactionsRepository.getBalance();

    return response.json({
        transactions: transactionsResults,
        balance,
    });
});

transactionsRouter.post('/', async (request, response) => {
    const { title, value, type, category } = request.body;

    const createTransaction = new CreateTransactionService();

    const transaction = await createTransaction.execute({
        title,
        value,
        type,
        category,
    });

    return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
    const { id } = request.params;

    const deleteTransaction = new DeleteTransactionService();

    await deleteTransaction.execute(id);

    return response.status(204).send();
});

transactionsRouter.post(
    '/import',
    upload.single('file'),
    async (request, response) => {
        const importTransactions = new ImportTransactionsService();

        const transactions = await importTransactions.execute(
            request.file.path,
        );

        return response.json(transactions);
    },
);

export default transactionsRouter;
