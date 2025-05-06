import path from 'path';
import readline from 'readline';
import os from 'os';
import { changeDirectory, listDirectoryContents, readFile, createFile, createDirectory, renameFile, copyFile, moveFile, deleteFile} from './fileOps.js';
import { handleOSCommands, calculateHash, compressFile, decompressFile } from './operatingSysInfo.js';

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
    } else if (trimmed.startsWith('os ')) {
      const option = trimmed.slice(3).trim();
      handleOSCommands(option);
    } else if (trimmed.startsWith('hash ')) {
      const filePath = path.resolve(process.cwd(), trimmed.slice(5).trim());
      calculateHash(filePath);
    } else if (trimmed.startsWith('compress ')) {
      const [sourcePath, destinationPath] = trimmed.slice(9).split(' ');
      compressFile(path.resolve(process.cwd(), sourcePath), path.resolve(process.cwd(), destinationPath));
    } else if (trimmed.startsWith('decompress ')) {
      const [sourcePath, destinationPath] = trimmed.slice(11).split(' ');
      decompressFile(path.resolve(process.cwd(), sourcePath), path.resolve(process.cwd(), destinationPath));
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


