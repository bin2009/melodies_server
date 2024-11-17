const formatDateToVietnamTime = (date) => {
    const createdAtVN = new Date(date);
    const formattedDate = createdAtVN.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ') + '+07';
    return formattedDate;
};

export const timeFormatter = {
    formatDateToVietnamTime,
};
