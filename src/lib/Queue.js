import Bee from 'bee-queue';
import redisConfig from '../config/redis';
import RegistrationNewMail from '../app/jobs/RegistrationNewMail';
import RegistrationUpdateMail from '../app/jobs/RegistrationUpdateMail';
import HelpOrderAnswerMail from '../app/jobs/HelpOrderAnswerMail';

const jobs = [RegistrationNewMail, RegistrationUpdateMail, HelpOrderAnswerMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    // job = key(), handle()
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];
      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
