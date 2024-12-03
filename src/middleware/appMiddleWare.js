import { StatusCodes } from 'http-status-codes';
import { duration } from 'moment-timezone';
import { parseBuffer } from 'music-metadata';
import db from '~/models';
import ApiError from '~/utils/ApiError';

const checkMaxDownsload = async () => {};

const checkMaxUpload = async (req, res, next) => {
    try {
        const packOfUser = await db.Subscriptions.findOne({
            where: { userId: req.user.id, statusUse: true },
            attributes: ['packageId'],
            raw: true,
        });
        const packInfo = await db.SubscriptionPackage.findOne({ where: { id: packOfUser.packageId }, raw: true });
        const playlist = await db.Playlist.findOne({
            where: { title: 'Nhạc của tôi', userId: req.user.id },
            raw: true,
        });
        const totalSong = await db.PlaylistSong.count({ where: { playlistId: playlist.id } });
        if (packInfo.uploads <= totalSong) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'You have reached the maximum number of uploads allowed.');
        }
        next();
    } catch (error) {
        next(error);
    }
};

const checkPremium = async (req, res, next) => {
    try {
        const currentUser = await db.User.findByPk(req.user.id);
        if (currentUser.accountType !== 'Premium')
            throw new ApiError(StatusCodes.FORBIDDEN, 'Please upgrade your account to perform this function.');
        next();
    } catch (error) {
        next(error);
    }
};

const calculateDuration = async (req, res, next) => {
    try {
        if (req.files) {
            if (!req.files.audioFile) {
                return next();
            } else {
                const buffer = req.files.audioFile[0].buffer;
                const mimeType = req.files.audioFile[0].mimetype;
                const metadata = await parseBuffer(buffer, mimeType);
                req.duration = metadata.format.duration;
                console.log('duration: ', req.duration);
                next();
            }
        }
        if (req.file) {
            console.log('signgle');
            return;
        }
    } catch (error) {
        next(error);
    }
};

export const appMiddleWare = {
    checkMaxDownsload,
    checkMaxUpload,
    checkPremium,
    calculateDuration,
};
