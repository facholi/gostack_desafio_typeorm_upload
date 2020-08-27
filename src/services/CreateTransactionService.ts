import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import { getRepository, getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string
  value: number
  type: 'income'|'outcome'
  category: string
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance()
      if (value > balance.total) {
        throw new AppError('The value is out of balance')
      }
    }

    const categoriesRepository = getRepository(Category)
    let foundCategory = await categoriesRepository.findOne({ where: { title: category } })

    if (!foundCategory) {
      foundCategory = categoriesRepository.create({ title: category })
      await categoriesRepository.save(foundCategory)
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: foundCategory.id
    })
    await transactionsRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService;
