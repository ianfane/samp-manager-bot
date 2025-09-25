import { Client } from 'ssh2';
import { createConnection } from 'mysql2/promise';
import { config } from './config.js';

export function executeServerCommand(commandParam) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log('SSH подключение установлено');
      
      const commands = [
        "export TERM=xterm",
        "",
        ``
      ];
      
      conn.exec(commands.join(' && '), (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        
        stream.on('close', (code) => {
          conn.end();
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Команда завершилась с кодом ${code}`));
          }
        });
        
        stream.on('data', (data) => {
          console.log('SSH output:', data.toString());
        });
        
        stream.stderr.on('data', (data) => {
          const errorText = data.toString();
          if (!errorText.includes('tput') && !errorText.includes('TERM')) {
            console.error('SSH error:', errorText);
          }
        });
      });
    });
    
    conn.on('error', (err) => {
      console.error('SSH ошибка:', err);
      reject(err);
    });
    
    conn.connect({
      host: config.SSH.HOST,
      username: config.SSH.USER,
      password: config.SSH.PASS,
      readyTimeout: 20000,
      keepaliveInterval: 10000
    });
  });
}

export async function backupDatabase(chatId, messageId) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `backup_${timestamp}.sql`;
    
    const dumpResult = await executeMysqldump(backupFilename);
    
    if (!dumpResult.success) {
      throw new Error(dumpResult.error);
    }
    
    return await getBackupFile(backupFilename, false);
    
  } catch (error) {
    console.error('Ошибка при создании бекапа:', error);
    throw error;
  }
}

export async function autoBackupDatabase(chatId) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `autobackup_${timestamp}.sql`;
    
    const dumpResult = await executeMysqldump(backupFilename);
    
    if (!dumpResult.success) {
      throw new Error(dumpResult.error);
    }
    
    return await getBackupFile(backupFilename, true);
    
  } catch (error) {
    console.error('Ошибка автоматического бекапа:', error);
    throw error;
  }
}

function executeMysqldump(filename) {
  return new Promise((resolve) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      const dumpCommand = `export TERM=xterm && mysqldump -u ${config.DATABASE.USER} -p${config.DATABASE.PASS} ${config.DATABASE.NAME} > ${filename}`;
      
      conn.exec(dumpCommand, (err, stream) => {
        if (err) {
          conn.end();
          resolve({ success: false, error: err.message });
          return;
        }
        
        stream.on('close', (code) => {
          conn.end();
          if (code === 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `mysqldump завершился с кодом ${code}` });
          }
        });
        
        stream.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          if ((errorOutput.includes('error') || errorOutput.includes('Error')) && 
              !errorOutput.includes('tput') && !errorOutput.includes('TERM')) {
            conn.end();
            resolve({ success: false, error: errorOutput });
          }
        });
      });
    });
    
    conn.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    
    conn.connect({
      host: config.SSH.HOST,
      username: config.SSH.USER,
      password: config.SSH.PASS,
      readyTimeout: 20000,
      keepaliveInterval: 10000
    });
  });
}

async function getBackupFile(filename, isAuto = false) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        
        sftp.stat(filename, (statErr, stats) => {
          if (statErr) {
            sftp.end();
            conn.end();
            reject(new Error(`Файл бекапа не найден: ${filename}`));
            return;
          }
          
          if (stats.size === 0) {
            sftp.end();
            conn.end();
            reject(new Error('Файл бекапа пуст'));
            return;
          }
          
          sftp.readFile(filename, (err, data) => {
            if (err) {
              sftp.end();
              conn.end();
              reject(err);
              return;
            }
          
            const caption = isAuto 
              ? `🕐 **Автоматический бекап** базы данных ${config.DATABASE.NAME}\n📅 ${new Date().toLocaleString('ru-RU')}`
              : `💾 Бекап базы данных ${config.DATABASE.NAME}\n📅 ${new Date().toLocaleString('ru-RU')}`;
            
            resolve({ data, filename, caption });
            sftp.unlink(filename, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Ошибка при удалении временного файла:', unlinkErr);
              }
              sftp.end();
              conn.end();
            });
          });
        });
      });
    });
    
    conn.on('error', (err) => {
      reject(err);
    });
    
    conn.connect({
      host: config.SSH.HOST,
      username: config.SSH.USER,
      password: config.SSH.PASS,
      readyTimeout: 20000,
      keepaliveInterval: 10000
    });
  });
}
