import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class RegistrationNewMail {
  get key() {
    return 'RegistrationNewMail';
  }

  async handle({ data }) {
    const { student, plan, registration } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: `Bem-vindo a Gympoint ${student.name} :)`,
      template: 'registration_new',
      context: {
        student: student.name,
        plan: plan.title,
        price: plan.price,
        final_price: registration.price,
        start_date: format(
          parseISO(registration.start_date),
          "d 'de' MMMM' de 'yyyy', às 'H:mm'h",
          {
            locale: pt,
          }
        ),
        end_date: format(
          parseISO(registration.end_date),
          "d 'de' MMMM' de 'yyyy', às 'H:mm'h",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new RegistrationNewMail();
