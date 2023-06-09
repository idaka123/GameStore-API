const express = require('express')
const router = express.Router()
const image = require('../controllers/file/image.controller')
const storage = require('../middleware/fileStorage')
const multer = require('multer');
const game = require('../Controllers/game.controller');

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check if the file is an image

        console.log("file", file)

        if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed.'));
        }
        cb(null, true);
    },
    limits: {
    //   fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
    },
});


router.post('/image/upload', upload.array('images', 10), image.upload);
router.post('/image/game',  upload.array('images', 10), game.uploadGameFile)
router.get('/image/:imageName', image.get)
router.delete('/image/:imageName', image.delete)
router.delete('/images', image.deleteAll)


module.exports = router
