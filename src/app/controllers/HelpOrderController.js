import * as Yup from 'yup';
import { parseISO, addMonths } from 'date-fns';
import { Op } from 'sequelize';

import HelpOrder from '../models/HelpOrder';
import Plan from '../models/Plan';
import Student from '../models/Student';

// import Queue from '../../lib/Queue';
// import HelpOrderNewMail from '../jobs/HelpOrderNewMail';
// import HelpOrderUpdateMail from '../jobs/HelpOrderUpdateMail';

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

    const registration = await HelpOrder.findByPk(req.params.id);
    if (!registration) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    const oldPlanId = registration.plan_id;

    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const existHelpOrder = await HelpOrder.findOne({
      where: {
        student_id,
        plan_id,
        end_date: {
          [Op.gte]: new Date(),
        },
      },
    });
    if (existHelpOrder) {
      return res
        .status(400)
        .json({ error: 'This student already has this plan active' });
    }

    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Invalid student' });
    }

    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const end_date = addMonths(parseISO(start_date), plan.duration);
    const price = plan.duration * plan.price;

    await registration.update({
      plan_id,
      start_date,
      end_date,
      price,
    });

    // if (oldPlanId !== plan_id) {
    //   await Queue.add(HelpOrderUpdateMail.key, {
    //     student,
    //     plan,
    //     registration,
    //   });
    // }

    return res.json(registration);
  }

  async delete(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const registration = await HelpOrder.findByPk(req.params.id);
    if (!registration) {
      return res.status(400).json({ error: 'Invalid registration' });
    }

    await registration.destroy();
    return res.json({ message: `HelpOrder deleted!` });
  }
}

export default new HelpOrderController();
