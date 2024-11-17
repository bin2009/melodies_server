import express from 'express';
const Router = express.Router();

import { authMiddleWare } from '~/middleware/authMiddleWare';
import { artistController } from '~/controllers/artistController';

Router.route('/allArtist').get(authMiddleWare.optionalVerifyToken, artistController.getAllArtist);
Router.route('/popular').get(authMiddleWare.optionalVerifyToken, artistController.getPopularArtist);
Router.route('/:id').get(authMiddleWare.optionalVerifyToken, artistController.getArtist);
Router.route('/song/:id').get(artistController.getSongOfArtist);

Router.route('/popSong/:artistId').get(authMiddleWare.optionalVerifyToken, artistController.getPopSong);
Router.route('/album/:artistId').get(authMiddleWare.optionalVerifyToken, artistController.getAlbumFromArtist);
Router.route('/single/:artistId').get(authMiddleWare.optionalVerifyToken, artistController.getSingleFromArtist);
Router.route('/feat/:artistId').get(authMiddleWare.optionalVerifyToken, artistController.getArtistFeat);
Router.route('/sameGenre/:artistId').get(authMiddleWare.optionalVerifyToken, artistController.getArtistSameGenre);

export default Router;
