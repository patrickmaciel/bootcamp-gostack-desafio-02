import * as Yup from 'yup';
import { parseISO, isBefore, addMonths } from 'date-fns';
import { Op } from 'sequelize';

import Registration from '../models/Registration';
import Plan from '../models/Plan';
import Student from '../models/Student';

import Queue from '../../lib/Queue';
import RegistrationNewMail from '../jobs/RegistrationNewMail';
import RegistrationUpdateMail from '../jobs/RegistrationUpdateMail';

class RegistrationController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const registrations = await Registration.findAll({
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'price', 'duration'],
        },
      ],
      limit: 2,
      offset: (page - 1) * 2,
      order: [['id', 'DESC']],
    });

    return res.json(registrations);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const existRegistration = await Registration.findOne({
      where: {
        student_id,
        plan_id,
        end_date: {
          [Op.gte]: new Date(),
        },
      },
    });
    if (existRegistration) {
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

    const registration = await Registration.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    await Queue.add(RegistrationNewMail.key, {
      student,
      plan,
      registration,
    });

    return res.json(registration);
  }

  async update(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid registration' });
    }

    const registration = await Registration.findByPk(req.params.id);
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

    const existRegistration = await Registration.findOne({
      where: {
        student_id,
        plan_id,
        end_date: {
          [Op.gte]: new Date(),
        },
      },
    });
    if (existRegistration) {
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

    if (oldPlanId !== plan_id) {
      await Queue.add(RegistrationUpdateMail.key, {
        student,
        plan,
        registration,
      });
    }

    return res.json(registration);
  }

  async delete(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      return res.status(400).json({ error: 'Invalid registration' });
    }

    await registration.destroy();
    return res.json({ message: `Registration deleted!` });
  }
}

export default new RegistrationController();
