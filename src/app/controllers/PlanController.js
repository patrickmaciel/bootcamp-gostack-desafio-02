import * as Yup from 'yup';
import Plan from '../models/Plan';

class PlanController {
  async index(req, res) {
    const plans = await Plan.findAll({
      attributes: ['id', 'title', 'duration', 'price'],
    });

    return res.json(plans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title, duration, price } = req.body;
    const plan = await Plan.create({
      title,
      duration,
      price,
    });

    return res.json(plan);
  }

  async update(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const schema = Yup.object().shape({
      title: Yup.string(),
      duration: Yup.number(),
      price: Yup.number(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    await plan.update(req.body);

    return res.json(plan);
  }

  async delete(req, res) {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const plan = await Plan.findByPk(req.params.id);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    await plan.destroy();
    return res.json({ message: `Plan ${plan.title} deleted!` });
  }
}

export default new PlanController();
