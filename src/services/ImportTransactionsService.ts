import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository'
import Category from '../models/Category';
import { getRepository, getCustomRepository, In } from 'typeorm';

interface CSVTransaction {
  title: string
  type: 'income' | 'outcome'
  value: number
  category: string
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactionsCSV: CSVTransaction[] = []

    const transactionsRepository = getCustomRepository(TransactionsRepository)

    console.log('lendo linhas')

    parseCSV.on('data', async line => {
      const [ title, type, value, category_title ] = line

      console.log(`linha extraída: ${line}`)

      transactionsCSV.push({
        title,
        value,
        type,
        category: category_title
      })
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categories = await this.persistCategoriesByTitle(transactionsCSV.map(transaction => transaction.category))

    const transactions = transactionsRepository.create(
      transactionsCSV.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categories.find(category => category.title === transaction.category)
      }))
    )

    transactionsRepository.save(transactions)

    fs.unlinkSync(filePath)

    return transactions
  }

  async persistCategoriesByTitle(titles: string[]): Promise<Category[]> {
    const categoriesRepository = getRepository(Category)

    const existentCategories = await categoriesRepository.find({ where: { title: In(titles) } })
    const titlesToAdd = titles.filter(title =>
      !existentCategories.map(existentCategory =>
        existentCategory.title
      ).includes(title)
    ).filter((title, index, self )=> index === self.indexOf(title))

    const newCategories = categoriesRepository.create(
      titlesToAdd.map(title => ({ title }))
    )
    await categoriesRepository.save(newCategories)

    return [...existentCategories, ...newCategories];
  }
}

export default ImportTransactionsService;
