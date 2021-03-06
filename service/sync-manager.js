'use strict';
const queueService = require('./queue-service');
const syncService = require('./sync-service');
const slackService = require('./slack-service');

const def = {
  syncBaseTables,
  queuePatients,
  updateSummaries,
  nightlyUpdates,
  maintenance
}

function maintenance(){
  return new Promise(async (resolve,reject) => {
      // await syncService.startSlave();
      // await syncService.killIdleConnections();
      resolve('Maintenance done ..');

  });

}

async function syncBaseTables(){

  return new Promise(async (resolve, reject) => {

  try{
    await syncService.updateFlatObs();
    await syncService.updateFlatLabObs();
    await syncService.updateFlatOrders();
    resolve('syncBaseTables successfull');

  }catch(e){
      console.log("nightlyUpdates ERROR", e);
      const defaultErrorMsg = 'Nightly Failed encoutered an error';
      const payload = {
        "text": `ERROR : ${e.error.sqlMessage ? e.error.sqlMessage : defaultErrorMsg} : Query : ${e.sqlQuery}`
      };
      slackService.postChannelMesssage(payload).then((res)=>{
        reject("Nightly Updates skipped after error..");
      }).catch((error)=>{
        reject(error);
      });
     
  }

});

 
  
}

function queuePatients(){
  return new Promise((resolve,reject) => {
      const queues = [queueService.generateHivSummarySyncQueue(),
        queueService.generateFlatAppointmentSyncQueue(),
        queueService.generateCovidExtractSyncQueue(),
        queueService.generateSurgeDailySyncQueue()
        ];
      
      queues.forEach(async (queue,index) => {
          await queue;
          console.log('Done', index);
      });
      resolve('All summaries updated done');
    });
 
}

function updateSummaries() {
  return new Promise(async (resolve, reject) => {
    try {
      await syncService.updateLabsAndImaging();
      console.log("Done Labs and imaging....");
      await syncService.updateCovidExtractSummary();
      console.log("Done Covid Extract Summary....");
      await syncService.updateHivSummary();
      console.log("Done Hiv Summary....");
      await syncService.updateFlatAppointment();
      console.log("Done Flat Appointment....");
      await syncService.updateHivSummary();
      console.log("Done Hiv Summary 2....");
      // await syncService.updateDefaulters();
      // console.log("Done Flat Defaulters....");
      await syncService.updateFlatConsent();
      console.log("Done Flat Consent....");
      await syncService.updateSurgeDailyDataset();
      console.log("Done Surge Daily Dataset....");
      resolve("Done updateSummaries ...");
    } catch (e) {
      console.log("Update Summaries Error..", e);
      const defaultErrorMsg = 'Updating Summaries Failed encoutered an error';
      const payload = {
        "text": `ERROR : ${e.error.sqlMessage ? e.error.sqlMessage : defaultErrorMsg}: Query : ${e.sqlQuery}`
      };
      slackService.postChannelMesssage(payload).then((res)=>{
        reject("Update Summaries skipped after error..");
      }).catch((error)=>{
        reject(error);
      });
    }
  });
}


function nightlyUpdates(){
  return new Promise(async (resolve,reject) => {
    try{
      await syncService.updateVitals();
      await syncService.updateCervicalScreening();
      await syncService.updateHivCervicalCancerScreening();
      await syncService.updateHivCervicalCancerScreeningMonthlySummary();
      await syncService.updateCovidMonthlySummary();
      await syncService.updateHivTransferOutSummary();
      await syncService.updateFlatDeathReporting();
      await syncService.updateHIVTransferIns();
      await syncService.updatePepSummary();
      await syncService.updateDefaulters();
      await syncService.updateCaseManager()
      // add missing hiv summary records to hivsummary sync queue;
      await syncService.checkHivMissingRecords();
      // update summaries for all the patients with missing summaries
      await syncService.batchUpdateHivSummary();
      await syncService.updateHivMonthlySummary();
      await syncService.findMissingHivMonthlyRecords();
      // update monthly again after the monthly check
      await syncService.updateHivMonthlySummary();
      await syncService.updateSurgeWeeklyReport();
      await syncService.updateCovidScreening();
      await syncService.updatePrepSummary();
      await syncService.updatePrepMonthlySummary();
      await syncService.updateFlatCdmSummary();
      await syncService.updateBreastCancerScreening();
      await syncService.updateFamilyTesting();
      resolve('Done nightly updates ...');
    } catch(e){
      console.log("nightlyUpdates ERROR", e);
      const defaultErrorMsg = 'Nightly Failed encoutered an error';
      const payload = {
        "text": `ERROR : ${e.error.sqlMessage ? e.errorsqlMessage : defaultErrorMsg} : Query : ${e.sqlQuery}`
      };
      slackService.postChannelMesssage(payload).then((res)=>{
        reject("Nightly Updates skipped after error..");
      }).catch((error)=>{
        reject(error);
      });

    }

    

  });

}




module.exports = def;