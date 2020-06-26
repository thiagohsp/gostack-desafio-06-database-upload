import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const foundTransaction = await transactionsRepository.findOne(id);

    if (!foundTransaction) throw new AppError('transaction not found');

    await transactionsRepository.remove(foundTransaction);
  }
}

export default DeleteTransactionService;
