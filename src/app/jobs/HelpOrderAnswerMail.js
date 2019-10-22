import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class HelpOrderAnswerMail {
  get key() {
    return 'HelpOrderAnswerMail';
  }

  async handle({ data }) {
    const { student, question, answer, answer_at } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Resposta a sua pergunta - Gympoint :)',
      template: 'help_order_answer',
      context: {
        student: student.name,
        question,
        answer,
        answerAt: format(
          parseISO(answer_at),
          "d 'de' MMMM' de 'yyyy', às 'H:mm'h",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new HelpOrderAnswerMail();
