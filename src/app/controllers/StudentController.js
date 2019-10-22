import * as Yup from 'yup';
import { Op } from 'sequelize';

import Student from '../models/Student';
import HelpOrder from '../models/HelpOrder';

class StudentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number().required(),
      weight: Yup.number().required(),
      height: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });
    if (studentExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const { name, email, age, weight, height } = req.body;
    const { id } = await Student.create({
      name,
      email,
      age,
      weight,
      height,
    });

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }

  async update(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid Student' });
    }

    const { id } = req.params;

    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      age: Yup.number(),
      weight: Yup.number(),
      height: Yup.number(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(400).json({ error: 'Student not exists' });
    }

    const { name, email, age, weight, height } = req.body;

    if (email !== student.email) {
      const studentEmail = await Student.findOne({
        // where: { email, id: { [Op.not]: student.id } },
        where: { email },
      });
      if (studentEmail) {
        return res.status(400).json({
          error: 'Sorry! This email has already taken by another student',
        });
      }
    }

    await student.update(req.body);

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }

  async helpOrders(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const helpOrders = await HelpOrder.findAll({
      where: {
        student_id: req.params.id,
      },
    });

    return res.json(helpOrders);
  }
}

export default new StudentController();
