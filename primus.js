const fs = require('fs');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule');

const API_URL = 'https://api.padolabs.org/achievement/complete';
const TOKEN_FILE = path.join(__dirname, 'token.txt');
const TASK_IDENTIFIER = 'DAILY_CHECK_IN';
const SCHEDULE_TIME = '0 0 9 * * *'; 

function readToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading token file:', error.message);
    process.exit(1);
  }
}

async function performDailyCheckIn() {
  const token = readToken();
  
  try {
    console.log('Performing daily check-in...');
    
    const response = await axios.post(API_URL, 
      {
        taskIdentifier: TASK_IDENTIFIER,
        ext: {}
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
          'client-type': 'WEB',
          'client-version': '0.3.24',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }
      }
    );
    
    const result = response.data;
    
    if (result.rc === 0 && result.mc === 'SUCCESS') {
      console.log(`✅ Check-in successful! Earned ${result.result.points} points.`);
      console.log(`Time: ${new Date().toLocaleString()}`);
      return true;
    } else {
      console.error('❌ Check-in failed:', result.msg || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error performing check-in:', error.response?.data || error.message);
    return false;
  }
}

function setupScheduler() {
  const dailyJob = schedule.scheduleJob(SCHEDULE_TIME, async function() {
    console.log(`Running scheduled check-in at ${new Date().toLocaleString()}`);
    await performDailyCheckIn();
  });
  
  console.log('Daily check-in scheduler started');
  console.log('Next check-in scheduled for:', dailyJob.nextInvocation().toLocaleString());
  
  return dailyJob;
}

async function runImmediately() {
  console.log('Running immediate check-in...');
  return await performDailyCheckIn();
}

async function main() {
  console.log('🔄 Starting daily check-in bot...');
  
  const args = process.argv.slice(2);
  const runNow = args.includes('--now') || args.includes('-n');
  const scheduleOnly = args.includes('--schedule-only') || args.includes('-s');
  
  try {
    if (runNow) {
      await runImmediately();
    }
    
    if (!args.includes('--now-only')) {
      setupScheduler();
    } else {
      console.log('Running in immediate-only mode, no scheduler set up.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  performDailyCheckIn,
  setupScheduler,
  runImmediately
};