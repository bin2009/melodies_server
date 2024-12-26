import { StatusCodes } from 'http-status-codes';
import { duration } from 'moment-timezone';
import { parseBuffer, parseStream } from 'music-metadata';
import https from 'https';
import { PLAYLIST_TYPE } from '~/data/enum';
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
