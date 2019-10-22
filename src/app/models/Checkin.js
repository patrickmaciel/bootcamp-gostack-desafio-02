import Sequelize, { Model } from 'sequelize';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

class Checkin extends Model {
  static init(sequelize) {
    super.init(
      {
        date: {
          type: Sequelize.VIRTUAL,
          get() {
            return format(
              this.createdAt,
              "d 'de' MMMM' de 'yyyy', às 'H:mm'h",
              {
                locale: pt,
              }
            );
          },
        },
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

export default Checkin;
