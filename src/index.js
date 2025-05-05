import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';
import { createWriteStream, createReadStream } from 'fs';


const args = process.argv.slice(2);
let username = 'Guest';

process.chdir(os.homedir());

for (const arg of args) {
  if (arg.startsWith('--username=')) {
    username = arg.split('=')[1];
    break;
  }
}

console.log(`Welcome to the File Manager, ${username}!`);
printCurrentDirectory();

const rli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

rli.prompt();

rli.on('line', async (line) => {
  const trimmed = line.trim();

  try {
    if (trimmed === '.exit') {
      exitProgram();
    } else if (trimmed === 'up') {
      goUp();
    } else if (trimmed.startsWith('cd ')) {
      const targetPath = trimmed.slice(3).trim();
      changeDirectory(targetPath);
    } else if (trimmed === 'ls') {
      listDirectoryContents();
    } else if (trimmed.startsWith('cat ')) {
      const filePath = path.resolve(process.cwd(), trimmed.slice(4).trim());
      await readFile(filePath);
    } else if (trimmed.startsWith('add ')) {
      const filePath = path.resolve(process.cwd(), trimmed.slice(4).trim());
      await createFile(filePath);
    } else if (trimmed.startsWith('mkdir ')) {
      const dirPath = path.resolve(process.cwd(), trimmed.slice(6).trim());
      await createDirectory(dirPath);
    } else if (trimmed.startsWith('rn ')) {
      const [oldFilePath, newFileName] = trimmed.slice(3).split(' ');
      await renameFile(path.resolve(process.cwd(), oldFilePath), newFileName);
    } else if (trimmed.startsWith('cp ')) {
      const [sourcePath, destinationPath] = trimmed.slice(3).split(' ');
      await copyFile(path.resolve(process.cwd(), sourcePath), path.resolve(process.cwd(), destinationPath));
    } else if (trimmed.startsWith('mv ')) {
      const [sourcePath, destinationPath] = trimmed.slice(3).split(' ');
      await moveFile(path.resolve(process.cwd(), sourcePath), path.resolve(process.cwd(), destinationPath));
    } else if (trimmed.startsWith('rm ')) {
      const filePath = path.resolve(process.cwd(), trimmed.slice(3).trim());
      await deleteFile(filePath);
    } else {
      console.log('Invalid Input');
    }
  } catch (err) {
    console.log('Operation failed:', err.message);
  }

  printCurrentDirectory();
  rli.prompt();
});

rli.on('SIGINT', () => {
  exitProgram();
});

function exitProgram() {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
  rli.close();
  process.exit(0);
}

function printCurrentDirectory() {
  console.log(`You are currently in ${process.cwd()}`);
}

function goUp() {
  const currentPath = process.cwd();
  const rootPath = path.parse(currentPath).root;

  if (currentPath === rootPath) {
    console.log('Operation failed: Cannot navigate above the root directory');
    return;
  }

  process.chdir('..');
}

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

// Command Functions
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
  
      // If the destination is a directory, append the source file name to the destination path
      const finalDestinationPath = destinationStats && destinationStats.isDirectory()
        ? path.join(destinationPath, path.basename(sourcePath))
        : destinationPath;
  
      await copyFile(sourcePath, finalDestinationPath); // Copy the file first
  
      // Check if the source file still exists before attempting to delete it
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
