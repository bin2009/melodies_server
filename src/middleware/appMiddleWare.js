import { StatusCodes } from 'http-status-codes';
import { duration } from 'moment-timezone';
import { parseBuffer, parseStream } from 'music-metadata';
import https from 'https';
import { PLAYLIST_TYPE } from '~/data/enum';
import db from '~/models';
import ApiError from '~/utils/ApiError';
import { Op } from 'sequelize';
import formatTime from '~/utils/timeFormat';

const checkMaxDownsload = async (req, res, next) => {
    try {
        const packOfUser = await db.Subscriptions.findOne({
            where: { userId: req.user.id, statusUse: true },
            attributes: ['packageId', 'startDate'],
            raw: true,
        });

        if (!packOfUser) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'You have not subscribed to any package yet. Please subscribe to a package to continue.',
            );
        }

        const packInfo = await db.SubscriptionPackage.findOne({ where: { id: packOfUser.packageId }, raw: true });

        if (!packInfo) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
        }

        if (packInfo.downloads === null) {
            next();
        } else {
            // lấy ra ngày đăng kí gói thành công
            // đếm số lần download ?
            const startDate = packOfUser.startDate;

            const downloads = await db.Download.count({
                where: { userId: req.user.id, createdAt: { [Op.gte]: new Date(formatTime(startDate)) } },
            });

            if (packInfo.downloads <= downloads) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "You've hit the download limit for your current plan. Upgrade now to unlock unlimited downloads and keep going!",
                );
            }

            next();
        }
    } catch (error) {
        console.log('loi check download', error);
        next(error);
    }
};

const checkMaxUpload = async (req, res, next) => {
    try {
        const packOfUser = await db.Subscriptions.findOne({
            where: { userId: req.user.id, statusUse: true },
            attributes: ['packageId'],
            raw: true,
        });

        if (!packOfUser) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'You have not subscribed to any package yet. Please subscribe to a package to continue.',
            );
        }

        const packInfo = await db.SubscriptionPackage.findOne({ where: { id: packOfUser.packageId }, raw: true });

        if (!packInfo) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
        }

        if (packInfo.uploads === null) {
            next();
        } else {
            const playlist = await db.Playlist.findOne({
                where: { title: PLAYLIST_TYPE.MYMUSIC, userId: req.user.id },
                raw: true,
            });
            const totalSong = await db.PlaylistSong.count({ where: { playlistId: playlist.id } });
            if (packInfo.uploads <= totalSong) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "You've hit the upload limit for your current plan. Upgrade now to unlock unlimited uploads and keep going!",
                );
            }
            next();
        }
    } catch (error) {
        next(error);
    }
};

const checkPremium = async (req, res, next) => {
    try {
        const currentUser = await db.User.findByPk(req.user.id);
        if (currentUser.accountType !== 'PREMIUM') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Please upgrade your account to perform this function.');
        }
        next();
    } catch (error) {
        console.log('loi check premium', error);
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

const getAudioDuration = async (key) => {
    try {
        const response = await new Promise((resolve, reject) => {
            https
                .get(`https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`, (response) => {
                    if (response.statusCode !== 200) {
                        console.error('Failed to fetch audio file, status code:', response.statusCode);
                        reject(new Error('Failed to fetch audio file'));
                    }
                    resolve(response);
                })
                .on('error', (error) => {
                    console.error('Error fetching audio file:', error);
                    reject(error);
                });
        });

        const metadata = await parseStream(response, response.headers['content-type']);
        return metadata.format.duration;
    } catch (error) {
        throw new Error('Failed to process audio file duration');
    }
};

export const appMiddleWare = {
    checkMaxDownsload,
    checkMaxUpload,
    checkPremium,
    calculateDuration,
    getAudioDuration,
};
