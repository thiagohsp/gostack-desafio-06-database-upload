import fs from 'fs';
import path from 'path';
import parse from 'csv-parse/lib/sync';
import { getRepository, In } from 'typeorm';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Record {
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(transactionsFilename: string): Promise<Transaction[] | null> {
    // TODO
    const transactionsFilePath = path.join(
      uploadConfig.directory,
      transactionsFilename,
    );

    // Read the content
    const content = await fs.promises.readFile(transactionsFilePath);

    // Parse the CSV content
    const records = parse(content, {
      columns: header =>
        header.map((column: string) => column.trim().toLowerCase()),
      trim: true,
    });

    const categories: string[] = [];
    // Print records to the console
    const transactions: CSVTransaction[] = records.map(
      (transaction: Record) => {
        const { title, value, type, category } = transaction;
        const csvTransaction: CSVTransaction = {
          title,
          value: Number(value),
          type,
          category,
        };

        if (categories.indexOf(category) < 0) categories.push(category);
        // transactions.push(csvTransaction);
        return csvTransaction;
      },
    );

    const foundCategories = await getRepository(Category).find({
      where: { title: In(categories) },
    });

    const foundCategoriesTitles = foundCategories.map(item => item.title);

    const categoriesToCreate = categories
      .filter(category => !foundCategoriesTitles.includes(category))
      .map(category => {
        return { title: category };
      });

    const createdCategories = await getRepository(Category).save(
      categoriesToCreate,
    );

    const finalCategories = [...foundCategories, ...createdCategories];

    const transactionsToCreate = transactions.map(transaction => {
      return {
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      };
    });

    const createdTransactions = await getRepository(Transaction).save(
      transactionsToCreate,
    );

    await fs.promises.unlink(transactionsFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
