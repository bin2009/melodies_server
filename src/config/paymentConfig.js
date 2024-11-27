import PayOS from '@payos/node';

const payos = new PayOS(process.env.PAYOS_API_KEY, process.env.PAYOS_API_SECRET, process.env.PAYOS_API_SALT);

export default payos;
