const DB = require('../../config/database')
const fs = require('fs');
const { promises: fsPromises } = require('fs');
const path = require('path');
const mime = require('mime-types');

const image = { 
    upload: async (req, res) => {
        const file = req.file;
        const imageId = req.body.imageId; // Retrieve the image ID from the form
    
        let connection
    
            if (!file) {
            return res.status(400).send('No image uploaded.');
            }
              
              connection = await DB.getConnection();
    
              await connection.beginTransaction();
    
              // Update the image file in the MySQL database
            try {
    
                const result = await connection.query(
                    'INSERT INTO images (filepath) VALUES (?)',
                    [file.path]
                );
    
                await connection.commit();
            
                if(result[0].affectedRows === 1){
                    res.status(200).json({msg : 'Image uploaded successfully.'});
                }
            } catch (error) {
                console.log(error)
    
                if (connection) {
                    await connection.rollback();
                  }
                  fs.unlinkSync(file.path);
    
                  return res.status(500).json({ msg: 'Server Error' });
            } finally {
                
                 // Release the connection back to the pool
              if (connection) {
                connection.release();
              }
            }
      
    },
    get: async (req, res) => {
        const imageName = req.params.imageName;
        const imagePath = path.join('uploads/', imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found.' });
          }
        
        // Set the Content-Type header based on the file extension
        const contentType = mime.contentType(path.extname(imageName));
        res.set('Content-Type', contentType);
      
        // Set caching headers (optional)
        res.set('Cache-Control', 'public, max-age=3600'); // Cache the image for 1 hour (adjust as needed)
      
        // Stream the image file to the response
        const imageStream = fs.createReadStream(imagePath);
        imageStream.pipe(res);
      
        // Handle stream errors
        imageStream.on('error', function (error) {
          res.status(500).json({ error: 'An error occurred while streaming the image.' });
        });
    },
    delete: async (req, res) => {
        const imageName = req.params.imageName;
        const imagePath = path.join( 'uploads', imageName);
        
            // Check if the file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found.' });
        }
        

        try {
                // Delete the file
                fsPromises.unlink(imagePath)
            
                // Remove the record from the database
            await DB.query('DELETE FROM images WHERE filepath = ?', [imagePath])

            return res.status(200).json({ message: 'Image deleted successfully.' });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ msg: 'Server Error' });
        }

    },
    deleteAll: async (req, res) => {
        // Delete all images
        const directory = path.join('uploads');

        // Check if the uploads directory exists
        if (!fs.existsSync(directory)) {
            return res.status(404).json({ error: 'No images found.' });
        }
        try {
            
            // Delete all files in the uploads directory
            const files = await fsPromises.readdir(directory);

            // Delete all files in the uploads directory
            for (const file of files) {
              const filePath = path.join(directory, file);
              await fsPromises.unlink(filePath);
            }
        

            await DB.query('DELETE FROM images')

            res.json({ message: 'All images deleted successfully.' });

        } catch (error) {
            console.log(error)
            
            return res.status(500).json({ msg: 'Server Error' });
        }

    }
}

module.exports = image