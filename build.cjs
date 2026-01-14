const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'GoTo-Extension.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function () {
    console.log('Package created successfully: ' + archive.pointer() + ' total bytes');
    console.log('GoTo-Extension.zip has been generated in the project root.');
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

// Use dist directory instead of src
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(distDir)) {
    archive.directory(distDir, false, (data) => {
        // Exclude the source large icon from the icons folder if it exists in dist
        if (data.name.endsWith('icon1024.png')) {
            return false;
        }
        return data;
    });
} else {
    console.error('Error: dist directory not found! Run npm run build first.');
    process.exit(1);
}

archive.finalize();
