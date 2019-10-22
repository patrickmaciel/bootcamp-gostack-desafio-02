import { subDays } from 'date-fns';
import { Op } from 'sequelize';

import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const { page = 1 } = req.query;

    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
      },
      attributes: ['id', 'date', 'createdAt'],
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

    return res.json(checkins);
  }

  async store(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // const today = new Date().setUTCHours(-2);
    // const initialDate = subDays(new Date(today), 5);
    // const todayDate = new Date(today);
    /*
    where: {
        student_id: req.params.studentId,
        createdAt: {
            [Op.gte]: moment().subtract(7, 'days').toDate(),
        },
    }
    */
    const lastFiveDaysCheckins = await Checkin.count({
      where: {
        student_id: req.params.id,
        created_at: {
          [Op.between]: [subDays(new Date(), 5), new Date()],
        },
      },
    });
    if (lastFiveDaysCheckins === 5) {
      return res
        .status(400)
        .json({ error: 'You cannot do more than 5 checkins in a week' });
    }

    const { id, date } = await Checkin.create({
      student_id: req.params.id,
    });

    return res.json({ id, date });
  }
}

export default new CheckinController();
