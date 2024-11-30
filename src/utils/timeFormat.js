import moment from 'moment-timezone';

const formatTime = (timestamp) => {
    return moment(timestamp).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
};

export default formatTime;
