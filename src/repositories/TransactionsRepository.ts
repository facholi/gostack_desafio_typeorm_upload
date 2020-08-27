import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    //this.createQueryBuilder('transactions').select('SUM(value)', 'income').where('type="income"')
    const transactions = await this.find()
    const balance = transactions.reduce((accumulator, transaction) => {
      if (transaction.type === 'income') {
        accumulator.income += transaction.value;
        return accumulator;
      } else {
        accumulator.outcome += transaction.value;
        return accumulator;
      }
    }, { income: 0, outcome: 0, total: 0 })

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
