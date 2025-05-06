import fs from 'fs';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';


function changeDirectory(targetPath) {
    const newPath = path.resolve(process.cwd(), targetPath);
    const rootPath = path.parse(process.cwd()).root;

    if (!newPath.startsWith(rootPath)) {
        console.log('Operation failed: Cannot navigate above the root directory');
        return;
    }

    if (!fs.existsSync(newPath) || !fs.statSync(newPath).isDirectory()) {
        console.log('Operation failed: Directory does not exist');
        return;
    }

    process.chdir(newPath);
}

function listDirectoryContents() {
    const currentPath = process.cwd();
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    const tableData = [];

    for (const item of items) {
        if (item.isDirectory()) {
            tableData.push({ Name: item.name, Type: 'directory' });
        } else if (item.isFile()) {
            tableData.push({ Name: item.name, Type: 'file' });
        }
    }

    tableData.sort((a, b) => {
        if (a.Type === b.Type) {
            return a.Name.localeCompare(b.Name);
        }
        return a.Type === 'directory' ? -1 : 1;
    });

    console.table(tableData);
}

async function readFile(filePath) {
    try {
        const stream = fs.createReadStream(filePath, 'utf-8');
        stream.on('data', (chunk) => {
            process.stdout.write(chunk);
        });
        stream.on('error', () => {
            console.log('Operation failed: File not found');
        });
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function createFile(filePath) {
    try {
        await fs.promises.writeFile(filePath, '');
        console.log('File created.');
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function createDirectory(dirPath) {
    try {
        await fs.promises.mkdir(dirPath);
        console.log('Directory created.');
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function renameFile(oldFilePath, newFileName) {
    try {
        const newFilePath = path.join(path.dirname(oldFilePath), newFileName);
        await fs.promises.rename(oldFilePath, newFilePath);
        console.log('File renamed.');
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function copyFile(sourcePath, destinationPath) {
    try {
        const readStream = createReadStream(sourcePath);
        const writeStream = createWriteStream(destinationPath);
        readStream.pipe(writeStream);
        writeStream.on('finish', () => {
            console.log('File copied.');
        });
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function moveFile(sourcePath, destinationPath) {
    try {
        const destinationStats = await fs.promises.stat(destinationPath).catch(() => null);

        const finalDestinationPath = destinationStats && destinationStats.isDirectory()
            ? path.join(destinationPath, path.basename(sourcePath))
            : destinationPath;

        await copyFile(sourcePath, finalDestinationPath); // Copy the file first

        const sourceExists = await fs.promises.access(sourcePath, fs.constants.F_OK).then(() => true).catch(() => false);
        if (sourceExists) {
            await fs.promises.unlink(sourcePath); // Delete the source file after copying
        }

        console.log('File moved.');
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}

async function deleteFile(filePath) {
    try {
        await fs.promises.unlink(filePath);
        console.log('File deleted.');
    } catch (err) {
        console.log('Operation failed:', err.message);
    }
}


export { changeDirectory, listDirectoryContents, readFile, createFile, createDirectory, renameFile, copyFile, moveFile, deleteFile};