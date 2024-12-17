import db from '~/models';
import { v4 as uuidv4 } from 'uuid';

const fetchAllPackage = async () => {
    try {
        const allPackages = await db.SubscriptionPackage.findAll({ order: [['createdAt', 'desc']] });
        const formatters = allPackages.map((p) => {
            const formatter = p.toJSON();
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            return formatter;
        });
        return formatters;
    } catch (error) {
        throw error;
    }
};

const createPackageService = async ({ data } = {}) => {
    return await db.SubscriptionPackage.create({
        id: uuidv4(),
        time: data.time,
        fare: parseFloat(data.fare.toFixed(3)),
        description: data.description,
        downloads: data.downloads,
        uploads: data.uploads,
        room: data.room,
    });
};

export const packageService = {
    fetchAllPackage,
    createPackageService,
};
