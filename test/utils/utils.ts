import * as amqp from 'amqplib/callback_api';
import DB from "../../src/models";
const config = require('../../config');

const jobQ = 'job_queue'
const successQ = 'success_queue'

export async function setupMockQueue(){
    amqp.connect(`amqp://${config.AMQP.USER}:${config.AMQP.PASS}@${config.AMQP.HOST}:${config.AMQP.PORT}`,
        (err, connection) => {
            if (err) throw err

            connection.createChannel((err2, channel) => {

                channel.assertQueue(successQ)
                channel.assertQueue(jobQ)
                channel.consume(jobQ, (msg) => {
                    const job = JSON.parse(msg.content.toString())
                    let payload;
                    if (job.testcases ) {
                        // submit_result
                        payload = {
                            id: job.id,
                            time: 1,
                            result: 'Success',
                            score: 100,
                            testcases: []
                        }
                    }
                    else if(job.submissionDirs) {
                        // project_result
                        payload = {
                            id: job.id,
                            stdout: 'stdout',
                            stderr: 'stderr',
                            time: 1,
                            code: 100,
                            score: 100
                        }
                    }
                    else {
                        // run_result
                        payload = {
                            id: job.id,
                            stderr: 'Success',
                            stdout: 'Success'
                        }
                    }
                    setTimeout(() => {
                        channel.sendToQueue(successQ, (new Buffer(JSON.stringify(payload))))
                        channel.ack(msg)
                    }, 1000)
                })
            })
        })
}

export async function truncateTables() {
    await DB.apikeys.destroy({truncate: true});
    await DB.langs.destroy({truncate: true});
    await DB.submissions.destroy({truncate: true});
}

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}