import * as Yup from 'yup';
import { Op } from 'sequelize';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

import Queue from '../../lib/Queue';
import HelpOrderAnswerMail from '../jobs/HelpOrderAnswerMail';

class HelpOrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const registrations = await HelpOrder.findAll({
      where: {
        answer_at: { [Op.is]: null },
      },
      attributes: ['id', 'question'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
      ],
      limit: 2,
      offset: (page - 1) * 2,
      order: [['id', 'DESC']],
    });

    return res.json(registrations);
  }

  async store(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(400).json({ error: 'Invalid student' });
    }

    const { question } = req.body;

    const { id } = await HelpOrder.create({
      student_id: req.params.id,
      question,
    });

    return res.json({ id, question });
  }

  async update(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid registration' });
    }

    const helpOrder = await HelpOrder.findOne({
      where: {
        id: req.params.id,
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    if (!helpOrder) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { answer } = req.body;

    await helpOrder.update({
      answer,
      answer_at: new Date(),
    });

    await Queue.add(HelpOrderAnswerMail.key, helpOrder);

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
