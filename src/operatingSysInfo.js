import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import {pipeline} from 'stream'

function handleOSCommands(option) {
    switch (option) {
      case '--EOL':
        console.log(`Default EOL: ${JSON.stringify(os.EOL)}`);
        break;
      case '--cpus':
        const cpus = os.cpus();
        console.log(`Number of CPUs: ${cpus.length}`);
        cpus.forEach((cpu, index) => {
          console.log(`CPU ${index + 1}: Model: ${cpu.model}, Speed: ${(cpu.speed / 1000).toFixed(2)} GHz`);
        });
        break;
      case '--homedir':
        console.log(`Home Directory: ${os.homedir()}`);
        break;
      case '--username':
        console.log(`System User Name: ${os.userInfo().username}`);
        break;
      case '--architecture':
        console.log(`CPU Architecture: ${os.arch()}`);
        break;
      default:
        console.log('Invalid OS command');
    }
  }
  
  function calculateHash(filePath) {
    if (!filePath) {
      console.error('Please provide a file path');
      return;
    }
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
  
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => {
      console.log(`Hash: ${hash.digest('hex')}`);
    });
    stream.on('error', (err) => {
      console.error('Error reading file:', err.message);
    });
  }
  
  function compressFile(inputPath, outputPath) {
    if (!inputPath || !outputPath) {
      console.error('Please provide input and output file paths');
      return;
    }
    const brotli = zlib.createBrotliCompress();
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);
  
    pipeline(source, brotli, destination, (err) => {
      if (err) {
        console.error('Compression failed:', err.message);
      } else {
        console.log('File compressed successfully');
      }
    });
  }
  
  function decompressFile(inputPath, outputPath) {
    if (!inputPath || !outputPath) {
      console.error('Please provide input and output file paths');
      return;
    }
    const brotli = zlib.createBrotliDecompress();
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);
  
    pipeline(source, brotli, destination, (err) => {
      if (err) {
        console.error('Decompression failed:', err.message);
      } else {
        console.log('File decompressed successfully');
      }
    });
  }

export { handleOSCommands, calculateHash, compressFile, decompressFile };