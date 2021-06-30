import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
    title: string;
    value: number;
    type: 'income' | 'outcome';
    category: string;
}

class CreateTransactionService {
    public async execute({
        title,
        value,
        type,
        category,
    }: Request): Promise<Transaction> {
        const transactionsRepository = getCustomRepository(
            TransactionsRepository,
        );

        const { total } = await transactionsRepository.getBalance();

        if (type === 'outcome' && value > total) {
            throw new AppError("You don't have ebough balance.");
        }

        const categoriesRepository = getRepository(Category);

        let transactionCategory = await categoriesRepository.findOne({
            where: { title: category },
        });

        if (!transactionCategory) {
            const newCategory = categoriesRepository.create({
                title: category,
            });
            transactionCategory = await categoriesRepository.save(newCategory);
        }

        const transaction = transactionsRepository.create({
            title,
            value,
            type,
            category_id: transactionCategory.id,
        });

        await transactionsRepository.save(transaction);

        return transaction;
    }
}

export default CreateTransactionService;
