import db from '~/models';
import { v4 as uuidv4 } from 'uuid';

const fetchAllPackage = async () => {
    return await db.SubscriptionPackage.findAll();
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
