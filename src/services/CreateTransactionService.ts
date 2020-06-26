import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
  validateTotal?: boolean;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
    validateTotal = true,
  }: Request): Promise<Transaction> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const findCategoryWithSameTitle = await categoryRepository.findOne({
      where: { title: category },
    });

    const selectedCategory = await categoryRepository.save({
      id: findCategoryWithSameTitle?.id,
      title: category,
    });

    const { total } = await transactionsRepository.getBalance();

    if (validateTotal && type === 'outcome' && value > total) {
      throw new AppError(
        'outcome should NOT be greater than total balance',
        400,
      );
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: selectedCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
