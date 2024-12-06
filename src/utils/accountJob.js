import { CronJob } from 'cron';
import { userService } from '~/services/userService';

const jobUpdateAccount = new CronJob(
    '38 13 * * *',
    () => {
        console.log('Checking for expired premium accounts...');
        userService.updateAccountType();
    },
    null,
    true,
    'Asia/Ho_Chi_Minh',
);

jobUpdateAccount.start();

// export default jobUpdateAccount;
