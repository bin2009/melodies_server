import express from 'express';
const Router = express.Router();

import { albumController } from '~/controllers/albumController';

Router.route('/top').get(albumController.getTopAlbum);
Router.route('/:albumId').get(albumController.getAlbum);

Router.route('/albumAnother/:albumId').get(albumController.getAlbumAnother);

export default Router;
