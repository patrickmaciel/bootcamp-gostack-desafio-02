import Sequelize, { Model } from 'sequelize';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

class HelpOrder extends Model {
  static init(sequelize) {
    super.init(
      {
        question: Sequelize.STRING,
        answer: Sequelize.STRING,
        answer_at: Sequelize.DATE,
        // answer_date: {
        //   type: Sequelize.VIRTUAL,
        //   get() {
        //     return format(this.answer_at, "d/M/yyyy 'às' H:mm'h'");
        //   },
        // },
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
  }
}

export default HelpOrder;
