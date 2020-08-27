import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import CreateTransactionService from '../services/CreateTransactionService';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import multer from 'multer';
import uploadConfig from '../config/upload'

const upload = multer(uploadConfig)

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository)

  const transactions = await transactionsRepository.find()
  const balance = await transactionsRepository.getBalance()

  return response.json({
    transactions,
    balance
  })
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService()
  const transaction = await createTransactionService.execute({ title, value, type, category })

  response.json(transaction)
});

transactionsRouter.delete('/:id', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository)
  await transactionsRepository.delete(request.params.id)

  return response.status(204).send()
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const importTransactionsService = new ImportTransactionsService()
  const transactions = await importTransactionsService.execute(request.file.path)

  return response.json(transactions)
});

export default transactionsRouter;
